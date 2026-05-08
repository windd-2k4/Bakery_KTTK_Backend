import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentStatus } from '../enums/payment.enum';

export class UpdatePaymentDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  responseCode?: string;

  @IsOptional()
  @IsString()
  responseMessage?: string;

  @IsOptional()
  @IsString()
  transactionId?: string;
}
