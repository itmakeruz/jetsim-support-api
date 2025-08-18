import {
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OperatorService } from './operator.service';
import {
  TicketIdDto,
  UserCardsDto,
  UserCardsTranDto,
  UserParamDto,
  UserQueryDto,
  WordsHintsDto,
} from './dto';
import { Request } from 'express';
import { AtGuard } from 'src/auth/auth.guard';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ChatModel,
  CloseTicketResponse,
  FilterDataModel,
  HintsResponse,
  TicketModel,
  UsersResponse,
} from './responses';
import {
  BadRequestExceptionResponse,
  GetTicektsResponse,
} from 'src/responses/AppServiceResponse';
import { OperatorRequest } from 'src/dto/operatorModel';
import { UserCardsResponse } from './responses/userCardsModel';
import { TransactionsResponse } from './responses/cardTransactions';

@Controller('operator')
@ApiTags('operator')
@ApiBearerAuth('access_token')
@UseGuards(AtGuard)
export class OperatorController {
  constructor(private service: OperatorService) {}

  @Get('users')
  @ApiOkResponse({ type: UsersResponse })
  @ApiBadRequestResponse({ type: BadRequestExceptionResponse })
  getUsers(@Query() query: UserQueryDto, @Req() req: Request) {
    let user: OperatorRequest = req['user'];
    let lang = req['headers']?.['accept-language'] || 'ru';
    return this.service.getUsers(query, user, lang);
  }

  @Get('categories')
  @ApiOkResponse({ type: GetTicektsResponse, isArray: true })
  @ApiBadRequestResponse({ type: BadRequestExceptionResponse })
  getCategories(@Req() req: Request) {
    let user: OperatorRequest = req['user'];
    let lang = req['headers']?.['accept-language'] || 'ru';
    return this.service.categories(user, lang);
  }

  @Get('filter-data')
  @ApiOkResponse({ type: FilterDataModel })
  @ApiBadRequestResponse({ type: BadRequestExceptionResponse })
  getStatus(@Req() req: Request) {
    let user: OperatorRequest = req['user'];
    let lang = req['headers']?.['accept-language'] || 'ru';
    return this.service.getFilterData(user, lang);
  }

  // @Get('user-cards/:user_id')
  // @ApiOkResponse({ type: UserCardsResponse, isArray: true })
  // @ApiBadRequestResponse({ type: BadRequestExceptionResponse })
  // getUserCards(@Param() param: UserCardsDto, @Req() req: Request) {
  //   let user: OperatorRequest = req['user'];
  //   let lang = req['headers']?.['accept-language'] || 'ru';
  //   return this.service.getusercards(param, user, lang);
  // }

  @Put('close-ticket/:id')
  @ApiOkResponse({ type: CloseTicketResponse, isArray: true })
  @ApiBadRequestResponse({ type: BadRequestExceptionResponse })
  closeTicket(@Param() param: TicketIdDto, @Req() req: Request) {
    let user: OperatorRequest = req['user'];
    let lang = req['headers']?.['accept-language'] || 'ru';
    return this.service.closeTicket(param, user, lang);
  }

  // @Get('card/:user_id/tranzactions')
  // @ApiOkResponse({ type: TransactionsResponse })
  // @ApiBadRequestResponse({ type: BadRequestExceptionResponse })
  // getTranzactions(
  //   @Param() param: UserCardsDto,
  //   @Query() query: UserCardsTranDto,
  //   @Req() req: Request,
  // ) {
  //   let user: OperatorRequest = req['user'];
  //   let lang = req['headers']?.['accept-language'] || 'ru';
  //   return this.service.getTranzactions(param, query, user, lang);
  // }

  @Get('user/tickets')
  @ApiOkResponse({ type: TicketModel, isArray: true })
  @ApiBadRequestResponse({ type: BadRequestExceptionResponse })
  getUserByIdTickets(@Query() query: UserParamDto, @Req() req: Request) {
    let user: OperatorRequest = req['user'];
    let lang = req['headers']?.['accept-language'] || 'ru';
    return this.service.getUserByIdTickets(query, user, lang);
  }

  @Get('ticket/:id/chats')
  @ApiOkResponse({ type: ChatModel })
  @ApiBadRequestResponse({ type: BadRequestExceptionResponse })
  async ticketChatsById(@Param() param: TicketIdDto, @Req() req: Request) {
    let user: OperatorRequest = req['user'];
    let lang = req['headers']?.['accept-language'] || 'ru';
    return this.service.ticketChatsById(param, user, lang);
  }

  @Get('words/hints')
  @ApiOkResponse({ type: HintsResponse, isArray: true })
  @ApiBadRequestResponse({ type: BadRequestExceptionResponse })
  async hints(@Query() query: WordsHintsDto, @Req() req: Request) {
    let user: OperatorRequest = req['user'];
    let lang = req['headers']?.['accept-language'] || 'ru';
    return this.service.getHints(query, user, lang);
  }
}
