import { BadRequestException, Injectable } from '@nestjs/common';
import {
  FilterType,
  TicketIdDto,
  UserCardsDto,
  UserCardsTranDto,
  UserParamDto,
  UserQueryDto,
  WordsHintsDto,
} from './dto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ChatModel,
  CloseTicketResponse,
  FilterDataModel,
  LastMessage,
  TicketModel,
  TicketResponseModel,
  UserModel,
  UsersResponse,
} from './responses';
import { OperatorRequest } from 'src/dto/operatorModel';
import { SendMessageResponse } from 'src/message-hendler/emitsmodel/sendmessage-response';
import { Message } from 'src/dto/openTicketDto';
import { ContentType, EmitTypes, StatusTypes, status_types } from 'src/dto/types';
import { GetTicektsResponse } from 'src/responses/AppServiceResponse';
import {
  conternt_types,
  error,
  four_week,
  proccess,
  status_dictonary,
  success,
  ten_days,
  ticket_notfound,
  two_week,
  week,
  yesterday,
} from 'src/dictonary';
import { Messages, Prisma, Tickets } from '@prisma/client';
import { PrismaNestService } from 'src/prisma/nestjs.prisma.service';
import { bankNames } from 'src/dto/bank-names';
import { cardsTypes } from 'src/dto/cards-types';
import { UserCardsResponse } from './responses/userCardsModel';
import { Transactions, TransactionsResponse } from './responses/cardTransactions';
import { SocketGateway } from 'src/app.gateway';
import { Helper } from 'src/helper/helper';
import { MyHttpService } from 'src/http/http.service';

@Injectable()
export class OperatorService {
  constructor(
    private prisma: PrismaService,
    private nestjs_prisma: PrismaNestService,
    private socket: SocketGateway,
    private httpService: MyHttpService,
    private config: ConfigService,
  ) {}

  async getUsers(data: UserQueryDto, user: OperatorRequest, lang): Promise<UsersResponse> {
    const { page, size, search } = data;
    let usersCount = await this.prisma.users.count();

    let users = await this.prisma.users.findMany({
      where: {
        AND: {
          NOT: { tickets: { none: {} } },
          name: { contains: search, mode: 'insensitive' },
        },
      },
      select: {
        id: true,
        chat_id: true,
        name: true,
        is_block: true,
        phone_number: true,
        is_online: true,
        updated_at: true,
        messages: { orderBy: { created_at: 'desc' } },
      },
      orderBy: { updated_at: 'desc' },
      skip: page == '1' ? +page - 1 : (+page - 1) * +size,
      take: +size,
    });
    let operator_config = await this.prisma.operators_config.findUnique({
      where: { operator_id: user.user_id },
    });

    let userIds = operator_config?.selected_users?.map((el) => Number(el)) ?? [];
    let selectedUsers = await this.prisma.users.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        chat_id: true,
        name: true,
        is_block: true,
        phone_number: true,
        is_online: true,
        updated_at: true,
        messages: { orderBy: { created_at: 'desc' } },
      },
      orderBy: { updated_at: 'desc' },
    });

    let formattedSelectedUser: UserModel[] = [];
    for (const item of selectedUsers) {
      formattedSelectedUser.push({
        id: item.id,
        chat_id: item.chat_id,
        name: item.name,
        date: Helper.formatByMonthName(item.updated_at, lang),
        last_message:
          item.messages[0].content_type != ContentType.TEXT
            ? { content: item.messages[0].content_type }
            : item.messages[0]?.message || { content: '' },
        phone: '',
        is_block: false,
        is_online: false,
        push: 0,
      });
    }

    let usersData: Array<UserModel> = [];
    users.forEach((user) => {
      usersData.push({
        id: user.id,
        chat_id: user.chat_id,
        name: user.name,
        is_block: user.is_block,
        date: Helper.formatByMonthName(user.updated_at, lang),
        phone: user.phone_number,
        is_online: user.is_online,
        last_message:
          user.messages[0].content_type != ContentType.TEXT
            ? { content: user.messages[0].content_type }
            : user.messages[0]?.message || { content: '' },
        push: user.messages.filter((msg) => msg.is_answer === 0 && msg.is_ready === false).length,
      });
    });
    let totalPage = Math.ceil(usersCount / Number(size));
    let response: UsersResponse = {
      totalPage: totalPage,
      totalUsers: usersCount,
      nextPage: +page != totalPage ? +page + 1 : null,
      prevPage: +page > 1 ? +page - 1 : null,
      selected_users: formattedSelectedUser,
      users: usersData.filter((e) => !formattedSelectedUser.map((us) => us.id)?.includes(e.id)),
    };
    return response;
  }

  async getUserByIdTickets(query: UserParamDto, user: OperatorRequest, lang): Promise<TicketResponseModel> {
    let queryTickets = [];
    let page = Number(query.page) || 1;
    let size = Number(query.size) || 1000;
    let totalElements = 0;
    if (!query) {
      let [tickets, count] = await Promise.all([
        this.prisma.tickets.findMany({
          select: {
            id: true,
            categories: true,
            user: {
              select: {
                id: true,
                name: true,
                is_online: true,
                photo: true,
              },
            },
            messages: {
              orderBy: {
                created_at: 'desc',
              },
            },
            updated_at: true,
            status: true,
            request_close: true,
            operator: true,
            last_request_user: true,
          },
          orderBy: { updated_at: 'desc' },
          skip: page == 1 ? +page - 1 : (+page - 1) * +size,
          take: +size,
        }),
        this.prisma.tickets.count(),
      ]);
      queryTickets = tickets;
      totalElements = count;
    } else {
      let ids: Array<number> =
        query.ids
          ?.split(',')
          ?.map((el) => (!isNaN(Number(el)) ? parseInt(el) : undefined))
          ?.filter((el) => el != undefined) || [];
      let c_ids: Array<number> =
        query.subject_ids
          ?.split(',')
          ?.map((el) => (!isNaN(Number(el)) ? parseInt(el) : undefined))
          ?.filter((el) => el != undefined) || [];
      let statuses = query?.statuses?.split(',')?.filter((el) => status_types.includes(el)) || [];
      let day = query.day;

      let filter: FilterType = { deleted: false };
      if (ids?.length) filter = { user_id: { in: ids } };
      if (statuses?.length) filter.status = { in: statuses };
      if (statuses?.includes(StatusTypes.MYTICKET)) {
        statuses.splice(statuses.indexOf(StatusTypes.MYTICKET), 1);
        if (!statuses.length) delete filter.status;
        filter.operator_id = user.user_id;
      }
      if (c_ids?.length) filter.category_id = { in: c_ids };

      if (day) {
        let from_date = new Date(new Date().getTime() - Number(day) * 24 * 60 * 60 * 1000);
        let to_date = new Date();
        filter.updated_at = { lte: to_date, gte: from_date };
      }

      let operator_config = await this.prisma.operators_config.findUnique({
        where: { operator_id: user.user_id },
      });
      if (operator_config) {
        await this.prisma.operators_config.update({
          where: { operator_id: user.user_id },
          data: { filters: Object(filter), selected_users: ids },
        });
      } else {
        await this.prisma.operators_config.create({
          data: {
            operator_id: user.user_id,
            filters: Object(filter),
            selected_users: ids,
          },
        });
      }
      let searchMessages = [];
      if (query.search) {
        searchMessages = await this.prisma.$queryRawUnsafe<Messages[]>(
          `select * from messages where content_type = 'text' and message->>'content' ilike '%${query.search}%'`,
        );
      }
      let [count, tickets] = await Promise.all([
        this.prisma.tickets.count({ where: { AND: filter } }),
        this.prisma.tickets.findMany({
          where: { AND: filter },
          select: {
            id: true,
            categories: true,
            user: { select: { id: true, name: true, is_online: true, photo: true } },
            messages: { orderBy: { created_at: 'desc' } },
            updated_at: true,
            status: true,
            request_close: true,
            operator: true,
            last_request_user: true,
          },
          orderBy: { updated_at: 'desc' },
          skip: page == 1 ? +page - 1 : (+page - 1) * +size,
          take: +size,
        }),
      ]);
      totalElements = count;
      if (searchMessages.length) {
        tickets = tickets.filter((ticket) => {
          searchMessages.forEach((msg) => {
            if (ticket.id === msg.ticket_id && !queryTickets.includes(ticket)) {
              ticket.messages = [msg];
              queryTickets.push(ticket);
            }
          });
        });
      } else queryTickets = tickets;
    }

    let ticketData: Array<TicketModel> = [];
    queryTickets.forEach((ticket) => {
      ticketData.push({
        id: ticket.id,
        subject: ticket.categories.name[lang],
        user_name: ticket.user.name,
        user_image: ticket.user.photo,
        base_url: this.config.get('FILES_BASE_URL'),
        color: ticket.categories.color,
        last_message:
          ticket.messages[0]?.content_type != ContentType.TEXT
            ? {
                content: ticket.messages[0]?.content_type,
                message_id: ticket.messages[0]?.id,
              }
            : {
                content: Object(ticket.messages[0]?.message)?.content,
                message_id: ticket.messages[0]?.id,
              },
        user_id: ticket.user.id,
        last_request_user: ticket.messages[0]?.is_answer === 0 ? ticket.user.name : ticket?.operator?.firs_name || '',
        push: ticket.messages.filter((message) => message.is_ready === false && message.is_answer === 0).length,
        formatted_date: Helper.formatByMonthName(ticket.updated_at, lang),
        status: ticket.status,
        request_close: ticket.request_close,
        is_online: ticket.user.is_online,
      });
    });
    // let totalPage, totalElements, nextPage, prevPage
    // if(page && size) {
    //     totalPage = Math.ceil(ticketData.length / size)
    //     totalElements = ticketData.length
    //     nextPage = +page != totalPage ? +page + 1 : null
    //     prevPage = +page > 1 ? +page - 1 : null
    //     ticketData = ticketData.slice(page * size - size, size * page)
    // }

    let responseData = {
      totalPage: Math.ceil(totalElements / size),
      totalElements,
      nextPage: +page != Math.ceil(totalElements / size) ? +page + 1 : null,
      prevPage: +page > 1 ? +page - 1 : null,
      tickets: ticketData,
    };

    return responseData;
  }

  async findAllTicket() {
    return;
  }

  async ticketChatsById(data: TicketIdDto, user: OperatorRequest, lang) {
    await this.prisma.messages.updateMany({
      where: { ticket_id: Number(data.id), is_ready: false },
      data: { is_ready: true },
    });
    let messages = await this.prisma.messages.findMany({
      where: { ticket_id: Number(data.id), deleted: false },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            name: true,
            chat_id: true,
            photo: true,
            phone_number: true,
            last_message: true,
            is_block: true,
            is_online: true,
            updated_at: true,
            messages: { where: { AND: { is_answer: 0, is_ready: false } } },
          },
        },
        operator: { select: { id: true, first_name: true, image: true } },
        tickets: {
          select: {
            id: true,
            status: true,
            request_close: true,
            updated_at: true,
            messages: { orderBy: { created_at: 'desc' }, take: 1 },
            categories: { select: { id: true, name: true, color: true } },
          },
        },
        is_answer: true,
        content_type: true,
        is_ready: true,
        message: true,
        created_at: true,
      },
      orderBy: { created_at: 'asc' },
    });
    if (!messages.length) throw new BadRequestException(ticket_notfound[lang]);
    let chatData: Array<SendMessageResponse> = [];
    messages.forEach((message) => {
      let sendmessage: Message = { content: Object(message.message).content };
      if (message.content_type == ContentType.REPLYTEXT) {
        let replyMessage = messages.find((mes) => mes.id == Object(message?.message)?.reply_message_id);
        sendmessage.reply_content = {
          content: Object(replyMessage?.message)?.content,
          content_type: replyMessage?.content_type,
          author: replyMessage?.is_answer == 0 ? message.user.name : message?.operator?.first_name,
        };
        sendmessage.reply_message_id = replyMessage?.id;
      }

      chatData.push({
        id: message.id,
        is_answer: message.is_answer,
        formatted_time: new Date(message.created_at.getTime() + 5 * 60 * 60 * 1000).toLocaleTimeString('ru'),
        date: message.created_at,
        base_url: this.config.get('FILES_BASE_URL'),
        author: message.is_answer == 0 ? message.user.name : message?.operator?.first_name,
        content_type: message.content_type,
        is_ready: message.is_ready,
        message: sendmessage,
      });
    });
    let oneData = messages[0];
    let pushCount = await this.prisma.messages.count({
      where: { user_id: oneData.user.id, is_answer: 0, is_ready: false },
    });
    let last_message: LastMessage = !['text', 'reply_text'].includes(oneData.tickets.messages[0].content_type)
      ? conternt_types[oneData.tickets.messages[0].content_type][lang]
      : {
          content: Object(oneData.tickets.messages[0].message).content || '',
          message_id: oneData.tickets.messages[0].id,
        };
    let responseData: ChatModel = {
      user: {
        id: oneData.user.id,
        chat_id: oneData.user.chat_id,
        name: oneData.user.name,
        phone: oneData.user.phone_number,
        date: oneData.user.updated_at.toLocaleString(),
        last_message: oneData.user.last_message,
        is_block: oneData.user.is_block,
        is_online: oneData.user.is_online,
        push: pushCount,
        user_image: oneData.user.photo,
        base_url: this.config.get('FILES_BASE_URL'),
      },
      ticket: {
        id: oneData.tickets.id,
        subject: oneData.tickets.categories.name[lang],
        user_name: oneData.user.name,
        color: oneData.tickets.categories.color,
        last_message: last_message,
        push: oneData.tickets.messages.filter((message) => message.is_ready === false && message.is_answer == 0).length,
        formatted_date: Helper.formatByMonthName(oneData.tickets.updated_at, lang),
        last_request_user: '',
        status: oneData.tickets.status,
        request_close: oneData.tickets.request_close,
        is_online: oneData.user.is_online,
        user_id: oneData.user.id,
      },
      messages: chatData,
    };

    let operator = await this.prisma.operators.update({
      where: { id: user.user_id },
      data: { ticket_id: Number(data.id), user_id: oneData.user.id },
    });
    let userData: UserModel = {
      id: oneData.user.id,
      chat_id: oneData.user.chat_id,
      name: oneData.user.name,
      date: Helper.formatByMonthName(oneData.user.updated_at, lang),
      last_message: oneData.tickets.messages[0].message,
      phone: oneData.user.phone_number,
      is_block: oneData.user.is_block,
      is_online: oneData.user.is_online,
      push: pushCount,
    };

    this.socket.server.to(operator.socket_id).emit(EmitTypes.UPDATEDUSER, userData);
    this.socket.server.to(operator.socket_id).emit(EmitTypes.UPDATETICKET, responseData.ticket);
    return responseData;
  }

  async categories(user: OperatorRequest, lang): Promise<GetTicektsResponse[]> {
    let categories = await this.prisma.categories.findMany({
      select: { id: true, name: true },
    });
    let responseData: GetTicektsResponse[] = [];
    for (const el of categories) {
      let count = await this.prisma.tickets.count({
        where: {
          AND: {
            category_id: el.id,
            OR: [{ operator_id: user.user_id }, { operator_id: null }],
          },
        },
      });
      let result: GetTicektsResponse = {
        id: el.id,
        name: el.name[lang] + ` (${count})`,
      };
      responseData.push(result);
    }
    return responseData;
  }

  async getFilterData(user?: OperatorRequest, lang?): Promise<FilterDataModel> {
    let mytickets = await this.prisma.tickets.findMany({
      where: { operator_id: user.user_id },
      select: { operator: true },
    });

    let tickets = await this.prisma.tickets.groupBy({
      by: ['status', 'category_id'],
      _count: { _all: true },
      orderBy: { status: 'asc' },
    });

    let result = { categories: {}, statuses: {} };

    let categories = await this.prisma.categories.findMany({
      select: { id: true, name: true },
    });
    for (const ticket of tickets) {
      result['categories'][ticket.category_id]
        ? (result['categories'][ticket.category_id] += ticket._count._all)
        : (result['categories'][ticket.category_id] = ticket._count._all);

      result['statuses'][ticket.status]
        ? (result['statuses'][ticket.status] += ticket._count._all)
        : (result['statuses'][ticket.status] = ticket._count._all);
    }

    let responseData: FilterDataModel = {
      categories: [],
      statuses: [],
      dates: [],
    };
    for (const category of Object.keys(result.categories)) {
      let category_name = categories.find((el) => el.id === Number(category)).name[lang];
      responseData.categories.push({
        id: Number(category),
        name: `${category_name} (${result.categories[category]})`,
        order: Number(category),
      });
    }

    responseData.statuses.push({
      slug: StatusTypes.MYTICKET,
      name: `${status_dictonary[StatusTypes.MYTICKET][lang]} (${mytickets.length})`,
      order: 1,
    });

    for (const status of Object.keys(result.statuses)) {
      responseData.statuses.push({
        slug: status,
        name: `${status_dictonary[status][lang]} (${result.statuses[status]})`,
        order: status_dictonary[status].order,
      });
    }

    let [days_28, days_14, days_10, days_7] = await this.getByDateTickets();

    responseData.dates = [
      { id: 7, name: `${week[lang]} (${days_7})`, order: 1 },
      { id: 10, name: `${ten_days[lang]} (${days_10})`, order: 2 },
      { id: 14, name: `${two_week[lang]} (${days_14})`, order: 3 },
      { id: 28, name: `${four_week[lang]} (${days_28})`, order: 4 },
    ];

    return responseData;
  }

  async getByDateTickets() {
    return await Promise.all([
      // 28 days
      this.prisma.tickets.count({
        where: {
          created_at: {
            gte: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 28),
            lte: new Date(),
          },
        },
      }),

      // 14 days
      this.prisma.tickets.count({
        where: {
          created_at: {
            gte: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 14),
            lte: new Date(),
          },
        },
      }),

      // 10 days
      this.prisma.tickets.count({
        where: {
          created_at: {
            gte: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 10),
            lte: new Date(),
          },
        },
      }),

      // 7 days
      this.prisma.tickets.count({
        where: {
          created_at: {
            gte: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7),
            lte: new Date(),
          },
        },
      }),
    ]);
  }

  async closeTicket(param: TicketIdDto, user: OperatorRequest, lang = 'ru'): Promise<CloseTicketResponse> {
    await this.prisma.tickets.update({
      where: { id: Number(param.id) },
      data: { request_close: true },
    });

    return { result: true, message: 'success' };
  }

  // async getusercards(
  //   param: UserCardsDto,
  //   client: OperatorRequest,
  //   lang,
  // ): Promise<UserCardsResponse[]> {
  //   const { user_id } = param;
  //   let user = await this.prisma.users.findUnique({
  //     where: { id: Number(user_id) },
  //   });

  //   if (!user) throw new BadRequestException('User not found');
  //   let cards = await this.httpService.get<{ cards: any[]; res: number }>(
  //     process.env.SUPPORT_URL,
  //     { params: { type: 'cards', phone: '998' + user.phone_number.slice(-9) } },
  //   );

  //   if (cards.data.res != 0) return [];

  //   let responseData: UserCardsResponse[] = [];
  //   cards.data?.cards.map((el) => {
  //     responseData.push({
  //       id: el.id,
  //       pan: this.replaceDigits(el.card),
  //       expire: '**/' + el.exp.slice(-2),
  //       holder: el.name,
  //       icon: '',
  //       bank_name: this.getCardBankName(el.card, lang),
  //       phone_number: '+998' + '****' + el.phone.slice(-4),
  //       status: 'active',
  //     });
  //   });
  //   return responseData;
  // }

  async getTranzactions(
    param: UserCardsDto,
    query: UserCardsTranDto,
    client: OperatorRequest,
    lang,
  ): Promise<TransactionsResponse> {
    const { card_ids, page = 1, size = 20 } = query;
    const { user_id } = param;
    let ids =
      card_ids
        ?.split(',')
        ?.map((el) => (!isNaN(Number(el)) ? parseInt(el) : undefined)) //
        ?.filter((el) => el != undefined) || [];

    let user = await this.prisma.users.findUnique({
      where: { id: Number(user_id) },
    });
    if (!user)
      return {
        totalPage: 0,
        totalElements: 0,
        nextPage: null,
        prevPage: null,
        transactions: [],
      };

    // let isUser = await this.nestjs_prisma.users.findFirst({where: {uuid: user.chat_id}})
    // if(!isUser) return { totalPage: 0, totalElements: 0, nextPage: null, prevPage: null, transactions: [] }

    // let cards = await this.nestjs_prisma.cards_list.findMany({
    //     where: { id: { in: ids } },
    //     select: { id: true, pan:true, phone: true, name: true, expire: true, status: true }
    // })

    // let transactionsCount = await this.nestjs_prisma.kassa.count({where: {
    //     user_id: Number(isUser.id),
    //     create_status: StatusTypes.ACCEPT,
    //     sender_account: {in: cards.map(el=>el.pan)}
    // },})
    // let transactions = await this.nestjs_prisma.kassa.findMany({
    //     where: {
    //         user_id: Number(isUser.id),
    //         create_status: StatusTypes.ACCEPT,
    //         sender_account: {in: cards.map(el=>el.pan)}
    //     },
    //     skip: page == '1' ? +page-1 : +page * +size,
    //     take: +size
    // })

    let transactionResponse = await this.httpService.get<{
      transactions: any[];
      res: string;
    }>(process.env.SUPPORT_URL, {
      params: {
        type: 'transactions',
        phone: '998' + user.phone_number.slice(-9),
        page: query.page,
      },
    });

    let responseData: Transactions[] = [];
    for (const transaction of transactionResponse.data?.transactions) {
      let statuses = {
        success: success[lang],
        wait: proccess[lang],
        get: proccess[lang],
        create: proccess[lang],
        error: error[lang],
      };
      let statusColors = {
        success: '#011D32',
        error: '#FE5F55',
        wait: '#FE8418',
        get: '#FE8418',
        create: '#FE8418',
      };
      responseData.push({
        name: transaction.partnerName,
        summa: (transaction.amount / 100).toLocaleString('uz-UZ', {
          minimumFractionDigits: 2,
        }),
        status: transaction.status == 'PR' ? statuses[StatusTypes.SUCCESS] : statuses.error,
        status_color: transaction.status == 'PR' ? statusColors[StatusTypes.SUCCESS] : statusColors['error'],
        formatted_date: '',
        icon: transaction.icon,
      });
    }

    let totalPage = Math.ceil(0 / Number(size));
    let response: TransactionsResponse = {
      totalPage: totalPage,
      totalElements: 0,
      nextPage: +page < totalPage ? +page + 1 : null,
      prevPage: +page > 1 ? +page - 1 : null,
      transactions: responseData,
    };

    return response;
  }

  async getHints(query: WordsHintsDto, user: OperatorRequest, lang = 'ru') {
    const { search } = query;

    const hints: Array<{ message: string }> = await this.prisma.$queryRawUnsafe<Array<{ message: string }>>(`
            select 
                distinct message ->> 'content' as message 
            from messages 
            where is_answer = 1 AND operator_id = ${user.user_id} AND message ->> 'content' ilike '%${search.replaceAll(/'/g, "''")}%' AND content_type = 'text' LIMIT 10 
        `);

    hints.map((e) => (e.message = e.message.replaceAll('\n', '')));
    return hints;
  }

  private getCardBankName(card: string, lang: string): string {
    let cardType = this.getCardVendor(card);
    let bankName = bankNames[cardType].filter(
      (c) => c.prefix.substring(0, c.prefix.length) === card.substring(0, c.prefix.length),
    );
    return bankName[0] ? bankName[0]?.lang[lang] : '';
  }

  private getCardVendor(card: string): string {
    let cardTypeArray = cardsTypes.filter((c) => c.pan === card.substring(0, 4));
    if (cardTypeArray && cardTypeArray.length) {
      return cardTypeArray?.[0]?.type;
    } else {
      return null;
    }
  }

  private replaceDigits(card: string) {
    const strNumber = card.toString();
    const firstFourDigits = strNumber.slice(0, 6);
    const lastFourDigits = strNumber.slice(-4);
    const middleDigits = strNumber.slice(6, -4).replace(/\d/g, '*');
    return firstFourDigits + middleDigits + lastFourDigits;
  }

  private getCardIcon(card) {
    let cardType = this.getCardVendor(card);
    let cardInfo = bankNames[cardType].find(
      (c) => c.prefix.substring(0, c.prefix.length) === card.substring(0, c.prefix.length),
    );
    return cardInfo?.icon || 'default.svg';
  }
}
