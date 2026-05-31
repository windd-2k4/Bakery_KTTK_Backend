import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateOrderDto {
  @IsOptional()
  @IsObject()
  shippingAddress?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  note?: string;
}
