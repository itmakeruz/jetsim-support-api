import { Global, Module } from '@nestjs/common';
import { MyHttpService } from './http.service';
import { HttpModule, HttpService } from '@nestjs/axios';

@Global()
@Module({
    imports: [HttpModule],
    providers: [MyHttpService],
    exports: [MyHttpService]
})
export class MyHttpModule { }
