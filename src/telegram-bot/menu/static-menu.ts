import TelegramBot from 'node-telegram-bot-api';
type ButtonType = 'home' | 'language' | 'app_link' | 'home2';
const button = (btn: ButtonType, lang?) => {
  switch (btn) {
    case 'home':
      let home: {
        en: TelegramBot.ReplyKeyboardMarkup;
        ru: TelegramBot.ReplyKeyboardMarkup;
      } = {
        en: {
          resize_keyboard: true,
          keyboard: [[{ text: '📲 Download application' }, { text: '📞 Contact', request_contact: true }]],
        },
        ru: {
          resize_keyboard: true,
          keyboard: [[{ text: '📲 Скачать приложение' }, { text: '📞 Контакты', request_contact: true }]],
        },
      };
      return home[lang];
    case 'home2':
      let home2: {
        en: TelegramBot.ReplyKeyboardMarkup;
        ru: TelegramBot.ReplyKeyboardMarkup;
      } = {
        en: {
          resize_keyboard: true,
          keyboard: [[{ text: '📲 Download application' }, { text: '📞 Contact' }]],
        },
        ru: {
          resize_keyboard: true,
          keyboard: [[{ text: '📲 Скачать приложение' }, { text: '📞 Контакты' }]],
        },
      };
      return home2[lang];
    case 'language':
      let language: TelegramBot.InlineKeyboardMarkup = {
        inline_keyboard: [
          [
            { text: '🇷🇺 Русский', callback_data: 'ru' },
            { text: '🇺🇸 English', callback_data: 'en' },
          ],
        ],
      };
      return language;
    case 'app_link':
      let app_link: TelegramBot.InlineKeyboardMarkup = {
        inline_keyboard: [
          [
            {
              text: '📥 Play market',
              url: 'https://jetsim.ru',
              //   url: 'https://play.google.com/store/apps/details?id=uz.dpay.payment',
            },
          ],
          [
            {
              text: '📥 App Store',
              url: 'https://jetsim.ru',
              //   url: 'https://apps.apple.com/uz/app/digital-pay/id1668041807',
            },
          ],
        ],
      };
      return app_link;
  }
};

export { button };
