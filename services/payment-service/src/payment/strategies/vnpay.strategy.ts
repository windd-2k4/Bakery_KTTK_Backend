import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { IPaymentStrategy, PaymentStrategyResult } from './payment.strategy';

@Injectable()
export class VnpayStrategy implements IPaymentStrategy {
  constructor(private readonly configService: ConfigService) {}

  async createPayment(orderId: string, amount: number, description?: string): Promise<PaymentStrategyResult> {
    const returnUrl = this.configService.get<string>('VNPAY_RETURN_URL') ?? 'http://localhost:3000/payment-return';
    const tmnCode = this.configService.get<string>('VNPAY_TMN_CODE') ?? 'DEMO';
    const secretKey = this.configService.get<string>('VNPAY_SECRET_KEY') ?? 'DEMO_SECRET';
    const baseUrl = this.configService.get<string>('VNPAY_PAYMENT_URL') ?? 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const txnRef = `VNPAY-${orderId}-${Date.now()}`;

    const params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Amount: String(Math.round(amount * 100)),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: description ?? `Payment for order ${orderId}`,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: returnUrl,
      vnp_CreateDate: this.formatDate(new Date()),
    };

    const sorted = this.sortObject(params);
    const signData = new URLSearchParams(sorted).toString();
    const secureHash = crypto.createHmac('sha512', secretKey).update(Buffer.from(signData, 'utf-8')).digest('hex');
    const paymentUrl = `${baseUrl}?${signData}&vnp_SecureHash=${secureHash}`;

    return {
      success: true,
      reference: txnRef,
      paymentUrl,
      providerData: {
        provider: 'VNPAY',
        params: sorted,
      },
    };
  }

  async handleWebhook(payload: Record<string, unknown>): Promise<PaymentStrategyResult> {
    return {
      success: payload?.['vnp_ResponseCode'] === '00',
      reference: typeof payload?.['vnp_TxnRef'] === 'string' ? String(payload['vnp_TxnRef']) : undefined,
      transactionId: typeof payload?.['vnp_TransactionNo'] === 'string' ? String(payload['vnp_TransactionNo']) : undefined,
      responseCode: typeof payload?.['vnp_ResponseCode'] === 'string' ? String(payload['vnp_ResponseCode']) : undefined,
      responseMessage: 'VNPAY webhook handled',
      providerData: payload,
    };
  }

  private formatDate(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }

  private sortObject(obj: Record<string, string>): Record<string, string> {
    return Object.keys(obj)
      .sort()
      .reduce<Record<string, string>>((acc, key) => {
        acc[key] = obj[key];
        return acc;
      }, {});
  }
}
