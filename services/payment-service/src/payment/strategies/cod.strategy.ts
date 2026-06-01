import { Injectable, Logger } from '@nestjs/common';
import { IPaymentStrategy, PaymentStrategyResult } from './payment.strategy';

@Injectable()
export class CodStrategy implements IPaymentStrategy {
  private readonly logger = new Logger(CodStrategy.name);

  async createPayment(
    orderId: string,
    amount: number,
    description?: string,
  ): Promise<PaymentStrategyResult> {
    this.logger.log(`COD payment created for order ${orderId} with amount ${amount}`);
    const reference = `COD-${orderId}-${Date.now()}`;

    return {
      success: true,
      reference,
      responseMessage: 'COD payment created successfully. Payment will be collected on delivery.',
    };
  }

  async handleWebhook(payload: Record<string, unknown>): Promise<PaymentStrategyResult> {
    try {
      const status = typeof payload?.['status'] === 'string' ? String(payload['status']) : '';
      const reference = typeof payload?.['reference'] === 'string' ? String(payload['reference']) : undefined;

      if (status === 'DELIVERED') {
        return {
          success: true,
          reference,
          responseMessage: 'COD payment confirmed on delivery',
        };
      }

      return {
        success: false,
        reference,
        responseMessage: 'COD payment pending',
      };
    } catch (error) {
      this.logger.error('COD webhook handling failed', error instanceof Error ? error.stack : String(error));
      return {
        success: false,
        responseMessage: 'Webhook processing failed',
      };
    }
  }
}
