import { IsOptional, IsUUID } from 'class-validator';

export class QueryOrdersDto {
  @IsOptional()
  @IsUUID()
  userId?: string;
}
