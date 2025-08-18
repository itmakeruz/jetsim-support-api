import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReportRepository } from './repositories/report.repository';
import { ReportQueriesDto } from './dto/queries.dto';

@Injectable()
export class ReportService {
  constructor(private repository: ReportRepository) {}

  async getAll(params: ReportQueriesDto) {
    return await this.repository.getAll(params);
  }
}
