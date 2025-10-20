import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto, UpdateUserDto, loginDto } from './dto';
import { JwtService } from '@nestjs/jwt';
import { OperatorRequest } from 'src/dto/operatorModel';
import { GetMeResponse } from './dto/response';
import { OperatorService } from 'src/operator/operator.service';
import { auth_error, operator_notfound, register_error } from 'src/dictonary';
import { SocketGateway } from 'src/app.gateway';
import { WsException } from '@nestjs/websockets';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private socket: SocketGateway,
  ) {}

  async login(data: loginDto, lang) {
    const { login, password } = data;
    let user = await this.prisma.operators.findFirst({
      where: { AND: { login: login } },
    });
    if (!user) throw new BadRequestException(auth_error[lang]);
    const md5 = crypto.createHash('md5').update(password).digest('hex');
    if (md5 != user.password) {
      throw new BadRequestException('Invalid login or Password');
    }
    await this.socket.server.to(user.socket_id).emit('unautharization', { status: '401', message: 'Unautharization' });
    return {
      success: true,
      data: {
        access_token: await this.jwtSign({ user_id: user.id, name: user.first_name }),
      },
    };
  }

  async signup(data: RegisterDto, lang) {
    const { login, password } = data;
    let user = await this.prisma.operators.findFirst({
      where: { AND: { login: login } },
    });
    if (user) throw new BadRequestException(register_error[lang]);
    const isSignPassword = crypto.createHash('md5').update(password).digest('hex');
    user = await this.prisma.operators.create({
      data: { login: login, password: isSignPassword, lang: 'uz' },
    });
    let updateuser = await this.prisma.operators.update({
      where: { id: user.id },
      data: {
        first_name: 'Operator №' + user.id,
        last_name: 'Operator №' + user.id,
      },
      select: { login: true, password: true },
    });
    updateuser.password = password;
    return {
      success: true,
      message: '',
      data: null,
    };
  }

  async updateUser(id: number, data: UpdateUserDto) {
    const operator = await this.prisma.operators.findUnique({
      where: {
        id: id,
      },
    });

    if (!operator) {
      throw new HttpException(
        {
          success: false,
          message: 'Unexpected error',
          data: null,
        },
        404,
      );
    }

    await this.prisma.operators.update({
      where: {
        id: id,
      },
      data: {
        login: data?.login ?? operator?.login,
        password: data?.password ? crypto.createHash('md5').update(data?.password).digest('hex') : operator?.password,
      },
    });
    return {
      success: true,
      message: '',
      data: null,
    };
  }

  async getme(user: OperatorRequest, lang) {
    let userInDb = await this.prisma.operators.findUnique({
      where: { id: user.user_id },
    });

    if (!userInDb) throw new BadRequestException(operator_notfound[lang]);

    let result: GetMeResponse = {
      id: userInDb.id,
      name: userInDb.first_name,
      photo: userInDb.image,
      login: userInDb.login,
    };

    return {
      success: true,
      message: '',
      data: result,
    };
  }

  private async jwtSign(payload: object): Promise<{ access_token: string }> {
    return { access_token: await this.jwtService.signAsync(payload) };
  }
}
