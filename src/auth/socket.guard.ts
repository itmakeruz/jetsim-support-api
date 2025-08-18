import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class MyWebSocketGuard implements CanActivate {
  constructor(private jwt: JwtService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();

    if (!client?.handshake?.headers?.token) throw new WsException({ status: '401', message: 'Unautharization' });

    try {
      let payload = await this.jwt.verify(client.handshake.headers.token);
      client.user = payload;
      return true;
    } catch (error) {
      console.log('error', error);

      throw new WsException({ status: '401', message: 'Unautharization' });
    }
  }
}
