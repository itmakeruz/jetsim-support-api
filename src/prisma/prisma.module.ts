import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaNestService } from './nestjs.prisma.service';

@Global()
@Module({
  providers: [PrismaService, PrismaNestService],
  exports: [PrismaService, PrismaNestService]
})
export class PrismaModule {}
