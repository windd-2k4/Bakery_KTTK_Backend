import { IsString, IsNumber, IsUUID, IsOptional,
         IsBoolean, IsArray, Min } from 'class-validator';
import { Transform } from 'class-transformer';
 
export class CreateProductDto {
  @IsString()
  name: string;
 
  @IsOptional()
  @IsString()
  slug?: string;
 
  @IsOptional()
  @IsString()
  description?: string;
 
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  price: number;
 
  @IsNumber()
  @Min(0)
  stock: number;
 
  @IsUUID()
  categoryId: string;
 
  @IsOptional()
  @IsString()
  imageUrl?: string;
 
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
 
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}