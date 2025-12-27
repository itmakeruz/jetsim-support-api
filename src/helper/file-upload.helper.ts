import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export async function saveFileLocal(fileUrl: string, payload: any) {
  const BASE_URL = 'https://jetsim.ru';

  const fullUrl = fileUrl.startsWith('http') ? fileUrl : BASE_URL + fileUrl;
  // Faylni yuklab olish
  const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });

  // Fayl extension aniqlash
  let ext = path.extname(fileUrl);
  if (!ext) ext = '.bin'; // extension topilmasa .bin qilib qo'yamiz

  // Papka yo'lini tayyorlash
  const folderPath = path.join(process.cwd(), 'files', payload.folder);
  await fs.promises.mkdir(folderPath, { recursive: true });

  // Fayl yo'li
  const filePath = path.join(folderPath, payload.filename + ext);

  // Diskka yozish
  await fs.promises.writeFile(filePath, response.data);

  // Nisbiy path qaytarish (DB uchun)
  return filePath.replace(process.cwd() + '/', '');
}
