import { documentTypes, MimeTypes } from '../dto/types';
import { Helper } from './helper';

describe('chat display helpers', () => {
  it('never returns an empty chat-list date for a future timestamp', () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);

    expect(Helper.formatByMonthName(future, 'ru')).not.toBe('');
  });

  it('accepts PDF as a supported document upload', () => {
    expect(documentTypes).toContain(MimeTypes.pdf);
  });
});
