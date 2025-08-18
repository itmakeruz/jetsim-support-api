import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportRepository } from './repositories/report.repository';
import { ReportController } from './report.controller';

@Module({
  controllers: [ReportController],
  providers: [ReportService, ReportRepository],
})
export class ReportModule {}
