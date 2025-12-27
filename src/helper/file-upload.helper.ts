import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export async function saveFileLocal(fileOrUrl: any, payload: any) {
  const folderPath = path.join(process.cwd(), 'files', payload.folder);
  await fs.promises.mkdir(folderPath, { recursive: true });

  let buffer: Buffer;
  let ext = '.bin';

  // ✅ 1. Agar Express.Multer.File kelsa (WEB / APP)
  if (fileOrUrl?.buffer instanceof Buffer) {
    buffer = fileOrUrl.buffer;
    ext = path.extname(fileOrUrl.originalname) || '.' + fileOrUrl.mimetype.split('/')[1];
  }

  // ✅ 2. Agar URL kelsa (TELEGRAM)
  else if (typeof fileOrUrl === 'string') {
    const BASE_URL = 'https://api.telegram.org';
    const fullUrl = fileOrUrl.startsWith('http') ? fileOrUrl : BASE_URL + fileOrUrl;

    const response = await axios.get(fullUrl, {
      responseType: 'arraybuffer',
    });

    buffer = Buffer.from(response.data);
    ext = path.extname(fullUrl) || '.bin';
  }

  // ❌ 3. Noma’lum holat
  else {
    throw new Error('Unsupported file input');
  }

  const filePath = path.join(folderPath, payload.filename + ext);
  await fs.promises.writeFile(filePath, buffer);

  return filePath.replace(process.cwd() + '/', '');
}
