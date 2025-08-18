import { Request } from 'express';

export interface ClientRequest extends Express.User {
  uuid?: string;
  phone?: string;
}
