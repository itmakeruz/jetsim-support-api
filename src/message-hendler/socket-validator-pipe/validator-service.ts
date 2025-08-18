import { PipeTransform, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Schema } from 'zod';
let count = 0;
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: Schema) {}

  async transform(value: any) {
    if (value.id) return value;
    try {
      if (typeof value == 'string') value = JSON.parse(value);
      this.schema.parse(value);
      return value;
    } catch (error) {
      throw new WsException({ status: '403', message: 'Bad Request', error });
    }
  }
}
