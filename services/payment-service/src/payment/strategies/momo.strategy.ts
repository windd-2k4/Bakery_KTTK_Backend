import { Injectable, Logger } from '@nestjs/common';
import { IPaymentStrategy, PaymentStrategyResult } from './payment.strategy';

@Injectable()
export class MomoStrategy implements IPaymentStrategy {
  private readonly logger = new Logger(MomoStrategy.name);
  private readonly momoUrl = process.env.MOMO_URL || 'https://test-payment.momo.vn/gw_payment/transactionProcessor';

  async createPayment(
    orderId: string,
    amount: number,
    description?: string,
  ): Promise<PaymentStrategyResult> {
    try {
      const requestId = `${orderId}-${Date.now()}`;
      const paymentUrl = `${this.momoUrl}?requestId=${requestId}&amount=${amount}`;

      return {
        success: true,
        paymentUrl,
        reference: requestId,
        responseMessage: 'MoMo payment URL generated successfully',
      };
    } catch (error) {
      this.logger.error('MoMo payment creation failed', error instanceof Error ? error.stack : String(error));
      return {
        success: false,
        responseMessage: `MoMo error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async handleWebhook(payload: Record<string, unknown>): Promise<PaymentStrategyResult> {
    try {
      const resultCode = typeof payload?.['resultCode'] === 'number' ? payload['resultCode'] : Number(payload?.['resultCode']);
      const transId = typeof payload?.['transId'] === 'string' ? String(payload['transId']) : undefined;
      const message = typeof payload?.['message'] === 'string' ? String(payload['message']) : undefined;

      if (resultCode === 0) {
        return {
          success: true,
          transactionId: transId,
          responseCode: '00',
          responseMessage: 'Payment successful',
        };
      }

      return {
        success: false,
        transactionId: transId,
        responseCode: String(resultCode),
        responseMessage: message || 'Payment failed',
      };
    } catch (error) {
      this.logger.error('MoMo webhook handling failed', error instanceof Error ? error.stack : String(error));
      return {
        success: false,
        responseMessage: 'Webhook processing failed',
      };
    }
  }
}
