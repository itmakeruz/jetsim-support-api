import { OperatorMessageHendler } from './operator-message-handler';

describe('OperatorMessageHendler', () => {
  it('routes a reply to the ticket owner while the operator changes chats', async () => {
    const create = jest.fn().mockResolvedValue({
      id: 901,
      created_at: new Date('2026-09-08T09:30:00.000Z'),
      is_answer: 1,
      content_type: 'text',
      is_ready: true,
      user: {
        id: 44,
        chat_id: 'customer-44',
        name: 'Customer',
        phone_number: '',
        is_block: false,
        is_online: true,
        action: { is_telegram_user: false },
      },
    });
    const tx = {
      tickets: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      messages: { create },
      users: { update: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      tickets: {
        findUnique: jest.fn().mockResolvedValue({
          id: 77,
          user_id: 44,
          operator_id: null,
          user: { action: { is_telegram_user: false } },
        }),
      },
      $transaction: jest.fn(async (callback) => callback(tx)),
      messages: { count: jest.fn().mockResolvedValue(0) },
      operators: { findMany: jest.fn().mockResolvedValue([{ id: 5 }]) },
    };
    const emitted: Array<{ room: string; event: string }> = [];
    const server = {
      to: jest.fn((room: string) => ({
        emit: (event: string) => emitted.push({ room, event }),
      })),
    };
    const ticketHelper = { notification: jest.fn().mockResolvedValue(undefined) };
    const handler = new OperatorMessageHendler(
      prisma as any,
      { get: jest.fn().mockReturnValue('https://files.example') } as any,
      ticketHelper as any,
    );
    const client = {
      id: 'operator-socket',
      user: { user_id: 5, name: 'Operator' },
      handshake: { headers: {} },
    } as any;

    const result = await handler.sendMessage({ ticket_id: 77, message: 'Assalomu alaykum' }, client, server as any);

    expect(result).toMatchObject({ ok: true, data: { id: 901, ticket_id: 77 } });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ticket_id: 77, user_id: 44, operator_id: 5 }),
      }),
    );
    expect(emitted).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ room: 'operator:5', event: 'newMessage' }),
        expect.objectContaining({ room: 'user:44', event: 'newMessage' }),
      ]),
    );
  });
});
