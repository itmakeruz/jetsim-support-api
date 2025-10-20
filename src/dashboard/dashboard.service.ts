import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    await this.prisma.categories.create({ data: dto });

    return {
      success: true,
      message: '',
      data: null,
    };
  }

  async findAll() {
    const categories = await this.prisma.categories.findMany();

    return {
      success: true,
      message: '',
      data: categories,
    };
  }

  async findOne(id: number) {
    const category = await this.prisma.categories.findUnique({ where: { id } });
    if (!category) throw new NotFoundException(`Category with ID ${id} not found`);
    return {
      success: true,
      message: '',
      data: category,
    };
  }

  async update(id: number, dto: UpdateCategoryDto) {
    const exists = await this.prisma.categories.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Category with ID ${id} not found`);
    await this.prisma.categories.update({ where: { id }, data: dto });

    return {
      success: true,
      message: '',
      data: null,
    };
  }

  async remove(id: number) {
    const exists = await this.prisma.categories.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Category with ID ${id} not found`);
    await this.prisma.categories.delete({ where: { id } });

    return {
      success: true,
      message: '',
      data: null,
    };
  }

  async getOperators() {
    const operators = await this.prisma.operators.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        login: true,
        is_active: true,
      },
    });
    return {
      success: true,
      message: '',
      data: operators,
    };
  }
}
