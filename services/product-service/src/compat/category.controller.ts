import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { ApiResponse } from '../common/api-response';
import { CategoryCreateRequestDto, CategoryUpdateRequestDto } from './dto/category-request.dto';
import { CategoryResponseDto } from './dto/pastry-response.dto';
import { CategoryService } from './category.service';

@Controller('category-management/api/v1/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse<CategoryResponseDto>> {
    const data = await this.categoryService.findById(id);
    return new ApiResponse(200, 'Successfully!', data);
  }

  @Post()
  async save(@Body() request: CategoryCreateRequestDto): Promise<ApiResponse<CategoryResponseDto>> {
    const data = await this.categoryService.save(request);
    return new ApiResponse(200, 'Successfully!', data);
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() request: CategoryUpdateRequestDto,
  ): Promise<ApiResponse<CategoryResponseDto>> {
    const data = await this.categoryService.update(id, request);
    return new ApiResponse(200, 'Successfully!', data);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse<boolean>> {
    const data = await this.categoryService.remove(id);
    return new ApiResponse(200, 'Successfully!', data);
  }

  @Get()
  async getAll(): Promise<ApiResponse<CategoryResponseDto[]>> {
    const data = await this.categoryService.findAll();
    return new ApiResponse(200, 'Successfully!', data);
  }
}