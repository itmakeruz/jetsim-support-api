import { WsException } from '@nestjs/websockets';
import { SendMessageData } from './schema';
import { ZodValidationPipe } from './validator-service';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(SendMessageData);

  it('accepts the Socket.IO message body', async () => {
    await expect(pipe.transform({ ticket_id: 425, message: 'нет' })).resolves.toEqual({
      ticket_id: 425,
      message: 'нет',
    });
  });

  it('does not treat a socket object as a message body', async () => {
    await expect(pipe.transform({ id: 'socket-id' })).rejects.toBeInstanceOf(WsException);
  });
});
