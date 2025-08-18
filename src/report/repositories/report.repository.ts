import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReportQueriesDto } from '../dto/queries.dto';
import { reportAdapter } from '../adapters/report.adapter';
import { Operators } from '@prisma/client';

@Injectable()
export class ReportRepository {
  constructor(private prisma: PrismaService) {}

  async getAll(query: ReportQueriesDto) {
    const operators = await this.prisma.operators.findMany({
      select: {
        tickets: {
          where: {
            updated_at: {
              gte: new Date(query.fromDate),
              lt: new Date(query.toDate),
            },
          },
        },
        id: true,
        first_name: true,
        last_name: true,
      },
    });

    const activeTicketsCount = await this.prisma.tickets.count({
      where: {
        AND: {
          status: 'active',
          updated_at: {
            gte: new Date(query.fromDate),
            lt: new Date(query.toDate),
          },
        },
      },
    });

    return {
      active_tickets: activeTicketsCount,
      ...reportAdapter(operators as any),
    };
  }
}
