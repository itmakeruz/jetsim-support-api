import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly categoriesService: DashboardService) {}

  @Post('category')
  @ApiOperation({ summary: 'Kategoriya yaratish' })
  @ApiResponse({ status: 201, description: 'Kategoriya muvaffaqiyatli yaratildi.' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Get('category')
  @ApiOperation({ summary: 'Barcha kategoriyalar ro‘yxati' })
  @ApiResponse({ status: 200, description: 'Kategoriyalar ro‘yxati qaytarildi.' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('operators')
  @ApiOperation({ summary: 'Operatorlarni Olish' })
  @ApiResponse({ status: 200, description: 'Operatorlarni Olish.' })
  // @ApiResponse({ status: 404, description: 'Kategoriya topilmadi.' })
  getOperators() {
    return this.categoriesService.getOperators();
  }

  @Get('category/:id')
  @ApiOperation({ summary: 'ID bo‘yicha kategoriya topish' })
  @ApiResponse({ status: 200, description: 'Kategoriya topildi.' })
  @ApiResponse({ status: 404, description: 'Kategoriya topilmadi.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Patch('category/:id')
  @ApiOperation({ summary: 'Kategoriyani yangilash' })
  @ApiResponse({ status: 200, description: 'Kategoriya yangilandi.' })
  @ApiResponse({ status: 404, description: 'Kategoriya topilmadi.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete('category/:id')
  @ApiOperation({ summary: 'Kategoriyani o‘chirish' })
  @ApiResponse({ status: 200, description: 'Kategoriya o‘chirildi.' })
  @ApiResponse({ status: 404, description: 'Kategoriya topilmadi.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
