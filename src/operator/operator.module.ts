import { Module } from '@nestjs/common';
import { OperatorService } from './operator.service';
import { OperatorController } from './operator.controller';
import { MyHttpService } from 'src/http/http.service';

@Module({
  imports: [MyHttpService],
  providers: [OperatorService],
  controllers: [OperatorController],
})
export class OperatorModule {}
