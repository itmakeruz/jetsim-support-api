import { Request } from "express";

export interface OperatorRequest extends Express.User {
    user_id?: number,
    name?: string
}