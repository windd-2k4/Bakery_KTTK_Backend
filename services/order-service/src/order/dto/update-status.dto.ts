import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';
import { IsUUID } from 'class-validator';

export class UpdateStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsUUID()
  changedBy?: string;

  @IsOptional()
  @IsString()
  actorRole?: string;
}
