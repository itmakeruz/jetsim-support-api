import { HttpService } from "@nestjs/axios";
import { BadRequestException, HttpException, Injectable } from "@nestjs/common";
import { AxiosRequestConfig, AxiosResponse, AxiosResponseHeaders, InternalAxiosRequestConfig, isAxiosError, RawAxiosResponseHeaders } from "axios";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

class MyAxiosResponse<T, D> implements AxiosResponse<T, D> {
    data: T;
    status: number;
    statusText: string;
    headers: RawAxiosResponseHeaders | AxiosResponseHeaders
    config: InternalAxiosRequestConfig<any>;
    request?: any;
    error: boolean
}

@Injectable()
export class MyHttpService {
    constructor(
        private http: HttpService
    ) { 
    }

    async get<T = any, D = any>(
        url: string, 
        config?: AxiosRequestConfig, 
        responseDto?: any
    ): Promise<MyAxiosResponse<T, D>> {
        try {
            let response = await this.http.get(
                url,
                config
            ).toPromise()

            
            return {
                data: response.data, 
                status: response.status,
                error: false,
                ...response
            }
        } catch (error) {
            console.log(error);
            
            if (isAxiosError(error)) {
                return {
                    error: true,
                    ...error?.response
                }
            }
            return null
        }
    }

    async post<T = any, D = any>(
        url: string, 
        data: any, 
        config?: AxiosRequestConfig, 
        responseDto?: any
    ): Promise<MyAxiosResponse<T, D>> {
        try {
            
            let response = await this.http.post(
                url,
                data,
                config
            ).toPromise()
            
            return {
                data: response.data,
                status: response.status,
                error: false,
                ...response
            }

        } catch (error) {
            console.log('error', error);
            if (isAxiosError(error)) {
                return {
                    error: true,
                    ...error?.response
                }
            }
            return null
        }
    }

    getMockResposne (url:string) {
        let obj = {
            
        }
        
        let key = Object.keys(obj).find(key => key == url.slice(0, key.length))
        
        return obj[key]
    }
}