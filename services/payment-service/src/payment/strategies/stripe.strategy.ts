import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPaymentStrategy, PaymentStrategyResult } from './payment.strategy';

@Injectable()
export class StripeStrategy implements IPaymentStrategy {
  constructor(private readonly configService: ConfigService) {}

  async createPayment(orderId: string, amount: number, description?: string): Promise<PaymentStrategyResult> {
    const baseUrl = this.configService.get<string>('STRIPE_CHECKOUT_BASE_URL') ?? 'https://checkout.stripe.com/c/pay';
    const sessionId = `cs_test_${orderId}_${Date.now()}`;

    return {
      success: true,
      sessionUrl: `${baseUrl}/${sessionId}`,
      reference: `stripe-${orderId}`,
      providerData: {
        provider: 'STRIPE',
        amount,
        description: description ?? `Payment for order ${orderId}`,
        sessionId,
      },
    };
  }

  async handleWebhook(payload: Record<string, unknown>): Promise<PaymentStrategyResult> {
    return {
      success: payload?.['type'] === 'checkout.session.completed',
      reference: typeof payload?.['orderId'] === 'string' ? String(payload['orderId']) : undefined,
      transactionId: typeof payload?.['id'] === 'string' ? String(payload['id']) : undefined,
      responseCode: '00',
      responseMessage: 'Stripe webhook handled',
      providerData: payload,
    };
  }
}
