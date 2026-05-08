import { IsOptional, IsString, IsNumber, IsUUID, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
 
export class FilterProductDto {
  @IsOptional()
  @IsString()
  search?: string;            // tìm theo tên
 
  @IsOptional()
  @IsUUID()
  categoryId?: string;        // lọc theo danh mục
 
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;
 
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;
 
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isAvailable?: boolean;
 
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;
 
  @IsOptional()
  @Type(() => Number)
  limit?: number = 12;
 
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';  // price | avgRating | createdAt
 
  @IsOptional()
  @IsString()
  order?: 'ASC' | 'DESC' = 'DESC';
}