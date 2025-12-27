import {
  Controller,
  Get,
  Render,
  BadRequestException,
  Res,
  Req,
  UseGuards,
  UseInterceptors,
  Param,
  Query,
  Post,
  Body,
  UploadedFiles,
  UploadedFile,
} from '@nestjs/common';
import { NextFunction, Request } from 'express';
import { PrismaService } from './prisma/prisma.service';
import { OperatorMessageHendler } from './message-hendler/operator-message-handler';
import { ClientMessageHendler } from './message-hendler/client-message-handler';
import { AtGuard } from './auth/auth.guard';
import { AppService } from './app.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiOkResponse,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import {
  BadRequestExceptionResponse,
  GetTicektsResponse,
  MyticketResponse,
  OpenTicketResponse,
  closeTicketResponse,
} from './responses/AppServiceResponse';
import { FileUploadDto, SendFileDto, closeTicketDto, openTicketDto } from './dto/openTicketDto';
import { ClientRequest } from './dto/clientModel';
import { MyTicketModel } from './responses/TicketsModel';
import { TicketIdDto } from './operator/dto';
import { SendMessageResponse } from './message-hendler/emitsmodel/sendmessage-response';
import { FileInterceptor } from '@nestjs/platform-express';
import { file_size_error } from './dictonary';
import { StatusTypes } from './dto/types';

@Controller('/client')
@ApiTags('chat')
@ApiBearerAuth('access_token')
@ApiBadRequestResponse({ type: BadRequestExceptionResponse })
@ApiHeader({
  name: 'accept-language',
  description: 'Default ru',
  schema: { default: 'ru' },
})
export class renderController {
  constructor(private service: AppService) {}

  @UseGuards(AtGuard)
  @Get('/ticketlist')
  @ApiOkResponse({ type: GetTicektsResponse, isArray: true })
  async getTickets(@Req() req: Request) {
    let user: ClientRequest = req['user'];
    let lang = req['headers']?.['lang']?.toString() || req['headers']?.['accept-language']?.toString() || 'ru';
    return await this.service.getTicketsList(user, lang);
  }

  @UseGuards(AtGuard)
  @Get('tickets')
  @ApiOkResponse({ type: MyticketResponse })
  async getMyTickets(@Req() req: Request) {
    let user: ClientRequest = req['user'];
    let lang = req['headers']?.['lang']?.toString() || req['headers']?.['accept-language']?.toString() || 'ru';
    return await this.service.getMyTickets(user, lang);
  }

  @UseGuards(AtGuard)
  @Post('ticket/close')
  @ApiOkResponse({ type: closeTicketResponse })
  async closeTicket(@Body() body: closeTicketDto, @Req() req: Request) {
    let user: ClientRequest = req['user'];
    let lang = req['headers']?.['lang']?.toString() || req['headers']?.['accept-language']?.toString() || 'ru';
    return await this.service.closeTicket(body, user, lang);
  }

  @UseGuards(AtGuard)
  @Get('ticket/:id/chats')
  @ApiOkResponse({ type: SendMessageResponse, isArray: true })
  async getTicketChatsById(@Param() param: TicketIdDto, @Req() req: Request) {
    let user: ClientRequest = req['user'];
    let lang = req['headers']?.['lang']?.toString() || req['headers']?.['accept-language']?.toString() || 'ru';
    return await this.service.getChatsByTicketId(param, user, lang);
  }

  @UseGuards(AtGuard)
  @Post('/ticket')
  @ApiOkResponse({ type: OpenTicketResponse })
  async openTicket(@Body() body: openTicketDto, @Req() req: Request) {
    let user = req['user'];
    let lang = req['headers']?.['lang']?.toString() || req['headers']?.['accept-language']?.toString() || 'ru';
    return await this.service.openTicket(body, user, lang);
  }

  @UseGuards(AtGuard)
  @Post('/upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FileUploadDto })
  @ApiOkResponse({ type: Object })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: SendFileDto,
    @Req() req: Request,
  ): Promise<any> {
    let user = req['user'];
    let lang = req['headers']?.['lang']?.toString() || req['headers']?.['accept-language']?.toString();
    if (file?.size > 100000000) {
      throw new BadRequestException(file_size_error[lang]);
    }
    return await this.service.upload(file, body, user, lang);
  }
}
