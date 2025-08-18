import TelegramBot from 'node-telegram-bot-api';
import { EventType } from './dto/actionModel';
import axios from 'axios';
const FormData = require('form-data');
import { configDotenv } from 'dotenv';

interface options extends TelegramBot.SendMessageOptions {
  chat_id: TelegramBot.ChatId;
  text?: string;
  photo?: string;
  message_id?: number;
}
const botSendMesssage = async (event: EventType, options: options): Promise<TelegramBot.Message> => {
  try {
    let response = await axios.get(`https://api.telegram.org/bot${configDotenv().parsed.TELEGRAM_BOT_TOKEN}/${event}`, {
      params: options,
    });
    return response?.data?.result;
  } catch (error) {
    console.log(error);
    return error?.response?.data;
  }
};

const botSendFile = async (
  event: EventType,
  options: options,
  files: Express.Multer.File,
): Promise<TelegramBot.Message> => {
  try {
    let type;
    if (event == 'sendPhoto') {
      type = 'photo';
    } else if (event == 'sendVideo') {
      type = 'video';
    } else if (event == 'sendDocument') {
      type = 'document';
    }
    let form = new FormData();
    form.append(type, files.buffer, { filename: files.originalname });
    // form.append( type, files.buffer, files.filename);
    const headers = form.getHeaders();

    let response = await axios({
      method: 'POST',
      url: `https://api.telegram.org/bot${configDotenv().parsed.TELEGRAM_BOT_TOKEN}/${event}`,
      params: options,
      headers: {
        ...headers,
      },
      data: form,
    });
    return response?.data?.result;
  } catch (error) {
    return error.response.data;
  }
};

export { botSendMesssage, botSendFile };
