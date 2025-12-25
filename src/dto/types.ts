export enum ContentType {
  TEXT = 'text',
  PHOTO = 'photo',
  VOICE = 'voice',
  VIDEO = 'video',
  DOCUMENT = 'document',
  REPLYDOCUMENT = 'reply_document',
  REPLYTEXT = 'reply_text',
  REPLYPHOTO = 'reply_photo',
  REPLYVIDEO = 'reply_video',
  REPLYVOICE = 'reply_voice',
  TELEGRAM_VIDEO = 'telegram_video',
}

export enum StatusTypes {
  SUCCESS = 'success',
  ACTIVE = 'active',
  ANSWERED = 'answered',
  EXPIRED = 'expired',
  AWAITING = 'awaiting',
  NOACTIVE = 'noactive',
  MYTICKET = 'myticket',
  CLOSED = 'closed',
  ACCEPT = 'accept',
}

export const StatusColors = {
  active: '#00CD69',
  answered: '#3C4BDC',
  expired: '#FF0000',
  noactive: '#B1B1B1',
  awaiting: '#FE8418',
  closed: '#000000',
};

export enum EmitTypes {
  SENDMESSAGE = 'sendMessage',
  NOTIFICATION = 'notification',
  NEWMESSAGE = 'newMessage',
  EXCEOPTION = 'exception',
  NEWTICKET = 'newticket',
  UPDATETICKET = 'updateticket',
  UPDATEMESSAGE = 'updatemessage',
  REMOVEMESSAGE = 'removemessage',
  EDITMESSAGE = 'editmessage',
  DELETEMESSAGE = 'deletemessage',
  UPDATEDUSER = 'updateduser',
  APPNEWMESSAGE = 'appSendMessage',
  EXITCHAT = 'exitchat',
}

export enum MimeTypes {
  jpeg = 'image/jpeg',
  png = 'image/png',
  pdf = 'application/pdf',
  docx = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls = 'application/vnd.ms-excel',
  doc = 'application/msword',
  svg = 'image/svg+xml',
  mp4 = 'video/mp4',
  mpeg = 'video/mpeg',
  ogg = 'video/ogg',
  webm = 'video/webm',
  gpp = 'video/3gpp',
  audioOgg = 'audio/ogg',
  audiompeg = 'audio/mpeg',
  aac = 'audio/aac',
}

export const imageTypes: Array<string> = [MimeTypes.jpeg, MimeTypes.png, MimeTypes.svg];

export const videoTypes: Array<string> = [MimeTypes.mp4, MimeTypes.mpeg, MimeTypes.ogg, MimeTypes.webm, MimeTypes.gpp];

export const audioTypes: Array<string> = [MimeTypes.audioOgg, MimeTypes.audiompeg, MimeTypes.aac];

export const documentTypes: Array<string> = [MimeTypes.docx, MimeTypes.xlsx, MimeTypes.xls, MimeTypes.doc];

export const status_types: Array<string> = [
  StatusTypes.ACTIVE,
  StatusTypes.ANSWERED,
  StatusTypes.AWAITING,
  StatusTypes.CLOSED,
  StatusTypes.NOACTIVE,
  StatusTypes.MYTICKET,
  StatusTypes.EXPIRED,
];
