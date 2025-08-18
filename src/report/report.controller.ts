import { Controller, Get, HttpCode, HttpStatus, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReportService } from './report.service';
import { ReportQueriesDto } from './dto/queries.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('reports')
@ApiTags('reports')
export class ReportController {
  constructor(private reportsService: ReportService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async get(@Query() query: ReportQueriesDto) {
    return await this.reportsService.getAll(query);
  }
}
