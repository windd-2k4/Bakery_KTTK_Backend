import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiResponse } from '../common/api-response';
import { PastryCreateRequestDto, PastryUpdateRequestDto } from './dto/pastry-request.dto';
import { PastryResponseDto } from './dto/pastry-response.dto';
import { PastryService } from './pastry.service';

@Controller('pastry-management/api/v1/pastries')
export class PastryController {
  constructor(private readonly pastryService: PastryService) {}

  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse<PastryResponseDto>> {
    const data = await this.pastryService.findById(id);
    return new ApiResponse(200, 'Successfully!', data);
  }

  @Post()
  async save(@Body() request: PastryCreateRequestDto): Promise<ApiResponse<PastryResponseDto>> {
    const data = await this.pastryService.save(request);
    return new ApiResponse(200, 'Successfully!', data);
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() request: PastryUpdateRequestDto,
  ): Promise<ApiResponse<PastryResponseDto>> {
    const data = await this.pastryService.update(id, request);
    return new ApiResponse(200, 'Successfully!', data);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse<boolean>> {
    const data = await this.pastryService.remove(id);
    return new ApiResponse(200, 'Successfully!', data);
  }

  @Get()
  async getAll(@Query('category') category?: string): Promise<ApiResponse<PastryResponseDto[]>> {
    const data = category ? await this.pastryService.findByCategory(category) : await this.pastryService.findAll();
    return new ApiResponse(200, 'Successfully!', data);
  }

  @Get('search')
  async search(@Query('keyword') keyword: string): Promise<ApiResponse<PastryResponseDto[]>> {
    const data = await this.pastryService.search(keyword);
    return new ApiResponse(200, 'Successfully!', data);
  }
}