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
    // Add 5 hours for time display only
    const inputDateWithTimeOffset = new Date(inputDate.getTime() + 5 * 60 * 60 * 1000);

    let dateString = '';
    const timeDiff = currentDate.getTime() - inputDate.getTime();
    const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24)); // kunga o'tkazadi

    if (currentDate.getDate() === inputDate.getDate() && currentDate.getMonth() === inputDate.getMonth()) {
      if (lang == 'en') {
        dateString =
          today[lang] +
          ` ${inputDateWithTimeOffset.toLocaleTimeString('uz-UZ', { minute: '2-digit', hour: '2-digit' })}`;
      } else {
        dateString =
          today[lang] +
          ` ${inputDateWithTimeOffset.toLocaleTimeString('uz-UZ', { minute: '2-digit', hour: '2-digit' })}`;
      }
    } else if (currentDate.getDate() - inputDate.getDate() === 1 && currentDate.getMonth() === inputDate.getMonth()) {
      dateString = yesterday[lang];
      if (lang == 'en') {
        dateString =
          yesterday[lang] +
          ` ${inputDateWithTimeOffset.toLocaleTimeString('uz-UZ', { minute: '2-digit', hour: '2-digit' })}`;
      } else {
        dateString =
          yesterday[lang] +
          ` ${inputDateWithTimeOffset.toLocaleTimeString('uz-UZ', { minute: '2-digit', hour: '2-digit' })}`;
      }
    } else if (dayDiff > 1 && inputDate.getFullYear() === currentDate.getFullYear()) {
      if (lang == 'en') {
        dateString = `${monthNames[lang][inputDate.getMonth()]} ${inputDate.getDate()} ${inputDateWithTimeOffset.toLocaleTimeString('uz-UZ', { minute: '2-digit', hour: '2-digit' })}`;
      } else {
        dateString = `${inputDate.getDate()} ${monthNames[lang][inputDate.getMonth()]} ${inputDateWithTimeOffset.toLocaleTimeString('uz-UZ', { minute: '2-digit', hour: '2-digit' })}`;
      }
    } else if (currentDate.getFullYear() - inputDate.getFullYear() >= 1) {
      if (lang == 'en') {
        dateString = `${monthNames[lang][inputDate.getMonth()]} ${inputDate.getDate()} ${inputDate.getFullYear()}`;
      } else {
        dateString = `${inputDate.getDate()} ${monthNames[lang][inputDate.getMonth()]} ${inputDate.getFullYear()}`;
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
