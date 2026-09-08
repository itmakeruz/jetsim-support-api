import { today, yesterday } from 'src/dictonary';
import * as dotenv from 'dotenv';
import * as Minio from 'minio';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// const minioClient = new Minio.Client({
//   endPoint: process.env.MINIO_HOST,
//   port: +process.env.MINIO_PORT,
//   useSSL: false,
//   accessKey: process.env.MINIO_ACCESS_KEY,
//   secretKey: process.env.MINIO_SECRET_KEY,
// });
// import Client from "./detect-language";

// let detectLanguage = new Client(dotenv.config().parsed.DETECT_LANGUAGE_KEY)
export class Helper {
  private static getDisplayTimeZone(): string {
    return process.env.APP_TIME_ZONE || 'Asia/Tashkent';
  }

  static formatMessageTime(date: Date, locale = 'ru-RU'): string {
    return new Intl.DateTimeFormat(locale, {
      timeZone: Helper.getDisplayTimeZone(),
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date(date));
  }

  private static formatShortTime(date: Date): string {
    return new Intl.DateTimeFormat('uz-UZ', {
      timeZone: Helper.getDisplayTimeZone(),
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(date));
  }

  private static getDisplayDateParts(date: Date): { year: number; month: number; day: number } {
    const values: Record<string, string> = {};
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: Helper.getDisplayTimeZone(),
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(new Date(date));

    for (const part of parts) {
      if (part.type !== 'literal') values[part.type] = part.value;
    }

    return {
      year: Number(values.year),
      month: Number(values.month),
      day: Number(values.day),
    };
  }

  private static getDisplayDayNumber(date: Date): number {
    const parts = Helper.getDisplayDateParts(date);
    return Math.floor(Date.UTC(parts.year, parts.month - 1, parts.day) / (1000 * 60 * 60 * 24));
  }

  static formatByMonthName(date: Date, lang: string): string {
    const monthNames = {
      ru: [
        'Январь',
        'Февраль',
        'Март',
        'Апрель',
        'Май',
        'Июнь',
        'Июль',
        'Август',
        'Сентябрь',
        'Октябрь',
        'Ноябрь',
        'Декабрь',
      ],
      uz: [
        'Yanvar',
        'Fevral',
        'Mart',
        'Aprel',
        'May',
        'Iyun',
        'Iyul',
        'Avgust',
        'Sentabr',
        'Oktabr',
        'Noyabr',
        'Dekabr',
      ],
      en: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
    };

    const currentDate = new Date();
    const inputDate = new Date(date);
    const inputTime = Helper.formatShortTime(inputDate);
    const currentDateParts = Helper.getDisplayDateParts(currentDate);
    const inputDateParts = Helper.getDisplayDateParts(inputDate);

    let dateString = '';
    const dayDiff = Helper.getDisplayDayNumber(currentDate) - Helper.getDisplayDayNumber(inputDate);

    if (dayDiff === 0) {
      if (lang == 'en') {
        dateString = today[lang] + ` ${inputTime}`;
      } else {
        dateString = today[lang] + ` ${inputTime}`;
      }
    } else if (dayDiff === 1) {
      dateString = yesterday[lang];
      if (lang == 'en') {
        dateString = yesterday[lang] + ` ${inputTime}`;
      } else {
        dateString = yesterday[lang] + ` ${inputTime}`;
      }
    } else if (dayDiff > 1 && inputDateParts.year === currentDateParts.year) {
      if (lang == 'en') {
        dateString = `${monthNames[lang][inputDateParts.month - 1]} ${inputDateParts.day} ${inputTime}`;
      } else {
        dateString = `${inputDateParts.day} ${monthNames[lang][inputDateParts.month - 1]} ${inputTime}`;
      }
    } else if (currentDateParts.year - inputDateParts.year >= 1) {
      if (lang == 'en') {
        dateString = `${monthNames[lang][inputDateParts.month - 1]} ${inputDateParts.day} ${inputDateParts.year}`;
      } else {
        dateString = `${inputDateParts.day} ${monthNames[lang][inputDateParts.month - 1]} ${inputDateParts.year}`;
      }
    } else {
      // A clock skew or a legacy timestamp must never make the chat-list date disappear.
      // Show the actual local date instead of returning an empty string for a future day.
      if (inputDateParts.year === currentDateParts.year) {
        dateString =
          lang == 'en'
            ? `${monthNames[lang][inputDateParts.month - 1]} ${inputDateParts.day} ${inputTime}`
            : `${inputDateParts.day} ${monthNames[lang][inputDateParts.month - 1]} ${inputTime}`;
      } else {
        dateString =
          lang == 'en'
            ? `${monthNames[lang][inputDateParts.month - 1]} ${inputDateParts.day} ${inputDateParts.year}`
            : `${inputDateParts.day} ${monthNames[lang][inputDateParts.month - 1]} ${inputDateParts.year}`;
      }
    }

    return dateString;
  }

  // static async uploadMinio(buffer: Buffer, destinationObject, metadata) {
  //   const bucket = 'storage';
  //   return await minioClient.putObject(bucket, destinationObject, buffer, null, metadata);
  // }

  static async detectLanguage(message: string) {
    try {
      // let langs = await detectLanguage.post('detect', { q: message })
      // langs = langs?.data?.detections?.filter(el => el.isReliable === true).sort((a, b) => a.confidence - b.confidence)
      // return ['uz', 'ru', 'en'].includes(langs[0]?.language) ?  langs[0]?.language : 'uz'
    } catch (error) {
      return undefined;
    }
  }

  static async uploadLocal(payload: { filename: string; folder: string; link: string }) {
    // Faylni yuklab olish
    const response = await axios.get(payload.link, {
      responseType: 'arraybuffer',
    });

    // Papka yo‘lini to‘liq qilish
    const folderPath = path.join(process.cwd(), 'files', payload.folder);
    await fs.promises.mkdir(folderPath, { recursive: true });

    // Fayl nomi va extension
    const filePath = path.join(folderPath, payload.filename + '.jpg');

    // Faylni saqlash
    await fs.promises.writeFile(filePath, response.data);

    // DB uchun nisbiy path qaytarish
    return filePath.replace(process.cwd() + '/', '');
  }
}
