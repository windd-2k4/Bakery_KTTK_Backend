import { IsEnum, IsString } from 'class-validator';
import { PaymentMethod } from '../enums/payment.enum';

export class CreatePaymentDto {
  @IsString()
  orderId: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;
}
