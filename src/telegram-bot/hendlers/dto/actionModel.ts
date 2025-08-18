import TelegramBot from 'node-telegram-bot-api';

export class actionModel {
  category_id: string;
  step: string;
  ticket_id: number;
}

export type EventType =
  | 'sendMessage'
  | 'sendPhoto'
  | 'sendDocument'
  | 'sendVideo'
  | 'editMessageText'
  | 'deleteMessage'
  | 'sendAudio';

export interface options extends TelegramBot.SendMessageOptions {
  chat_id: TelegramBot.ChatId;
  text?: string;
  photo?: string;
}
