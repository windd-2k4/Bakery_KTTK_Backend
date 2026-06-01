import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPaymentStrategy, PaymentStrategyResult } from './payment.strategy';

@Injectable()
export class SepayStrategy implements IPaymentStrategy {
  constructor(private readonly configService: ConfigService) {}

  async createPayment(orderId: string, amount: number, description?: string): Promise<PaymentStrategyResult> {
    const content = `SB${orderId}`;
    const accountNo = this.configService.get<string>('SEPAY_ACCOUNT_NO') ?? '0000000000';
    const accountName = this.configService.get<string>('SEPAY_ACCOUNT_NAME') ?? 'BAKERY KTTK';
    const bankCode = this.configService.get<string>('SEPAY_BANK_CODE') ?? '970422';
    const qrUrl = new URL('https://img.vietqr.io/image');
    qrUrl.pathname = `/image/${bankCode}-${accountNo}-compact2.png`;
    qrUrl.searchParams.set('amount', String(amount));
    qrUrl.searchParams.set('addInfo', content);
    qrUrl.searchParams.set('accountName', accountName);

    return {
      success: true,
      reference: content,
      paymentUrl: qrUrl.toString(),
      qrPayload: {
        bankCode,
        accountNo,
        accountName,
        transferContent: content,
        amount,
        qrImageUrl: qrUrl.toString(),
      },
      providerData: {
        provider: 'SEPAY',
        description: description ?? `Payment for order ${orderId}`,
      },
    };
  }

  async handleWebhook(payload: Record<string, unknown>): Promise<PaymentStrategyResult> {
    return {
      success: payload?.['status'] === 'success',
      reference: typeof payload?.['content'] === 'string' ? String(payload['content']) : undefined,
      transactionId: typeof payload?.['transactionId'] === 'string' ? String(payload['transactionId']) : undefined,
      responseCode: payload?.['status'] === 'success' ? '00' : '99',
      responseMessage: 'SePay webhook handled',
      providerData: payload,
    };
  }
}
