import {ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger} from "@nestjs/common";
import {Request, Response} from 'express'
import * as http from 'http';
import { errorException } from "./functionname";
import { botSendMesssage } from "src/telegram-bot/hendlers/botsender";

@Catch()
export class AllExceptionFilter implements ExceptionFilter{
    catch(exception: any, host: ArgumentsHost): any {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse<Response>()
        const request = ctx.getRequest<Request>()

        console.log(exception)
        
        let status: HttpStatus;
        let errorMessage: string;
        let errRes:any
        if(exception instanceof HttpException){
            
            status = exception.getStatus()
            errorMessage = exception.message
        }else {
            let exceptionFormatted = errorException(exception.stack)
            let text = `Error message ${exception.message}\n\nExeption: ${JSON.stringify(exceptionFormatted, null, 4)}\n\nReqbody : ${JSON.stringify(request.body, null, 4)}\n\nReqparam : ${JSON.stringify(request.params, null, 4)}\n\nReqquery : ${JSON.stringify(request.query, null, 4)}`
            botSendMesssage('sendMessage', {
                chat_id: 5415280885,
                text: text
            })
            status = HttpStatus.INTERNAL_SERVER_ERROR
            errorMessage= 'Internal server error occured!'
        }
        
        errRes = this.getErrorResponse(status, errorMessage, request)
        
        
        response.status(status).json(errRes)
    }
    private getErrorResponse = (status: HttpStatus, errorMessage: string, request: Request)=>({
        "message": errorMessage,
        "error": http.STATUS_CODES[status],
        "statusCode": status
    })
}