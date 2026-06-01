import {
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateOrderItemDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsNumber()
  @Min(0)
  productPrice: number;
}

export class CreateOrderDto {
  @IsUUID()
  userId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsObject()
  shippingAddress: Record<string, unknown>;

  @IsOptional()
  @IsString()
  note?: string;

  @IsString()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  bankAccountName?: string;

  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @IsOptional()
  @IsString()
  bankName?: string;
}
