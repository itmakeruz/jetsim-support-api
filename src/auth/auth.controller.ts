import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, loginDto } from './dto';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OperatorRequest } from 'src/dto/operatorModel';
import { GetMeResponse } from './dto/response';
import { Request } from 'express';
import { AtGuard } from './auth.guard';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private service: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: loginDto, @Req() req: Request) {
    let lang = req.headers['accept-language'] || 'ru';
    return await this.service.login(body, lang);
  }

  @Post('signup')
  @HttpCode(HttpStatus.OK)
  async signup(@Body() body: RegisterDto, @Req() req: Request) {
    let lang = req.headers['accept-language'] || 'ru';
    return await this.service.signup(body, lang);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ type: GetMeResponse })
  @ApiBearerAuth('access_token')
  @UseGuards(AtGuard)
  async getMe(@Req() req: Request) {
    let user: OperatorRequest = req['user'];
    let lang = req.headers['accept-language'] || 'ru';
    return await this.service.getme(user, lang);
  }
}
