import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoriesService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Kategoriya yaratish' })
  @ApiResponse({ status: 201, description: 'Kategoriya muvaffaqiyatli yaratildi.' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Barcha kategoriyalar ro‘yxati' })
  @ApiResponse({ status: 200, description: 'Kategoriyalar ro‘yxati qaytarildi.' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ID bo‘yicha kategoriya topish' })
  @ApiResponse({ status: 200, description: 'Kategoriya topildi.' })
  @ApiResponse({ status: 404, description: 'Kategoriya topilmadi.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Kategoriyani yangilash' })
  @ApiResponse({ status: 200, description: 'Kategoriya yangilandi.' })
  @ApiResponse({ status: 404, description: 'Kategoriya topilmadi.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Kategoriyani o‘chirish' })
  @ApiResponse({ status: 200, description: 'Kategoriya o‘chirildi.' })
  @ApiResponse({ status: 404, description: 'Kategoriya topilmadi.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
