// src/review/dto/create-review.dto.ts
import { IsString, IsNumber, IsUUID, IsOptional,
         IsArray, Min, Max } from 'class-validator';
 
export class CreateReviewDto {
  @IsUUID()
  productId: string;
 
  @IsUUID()
  orderId: string;    // phải cung cấp orderId để verify đã mua
 
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;
 
  @IsOptional()
  @IsString()
  comment?: string;
 
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}