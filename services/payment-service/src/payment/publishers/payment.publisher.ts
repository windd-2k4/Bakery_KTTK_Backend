import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

export interface PaymentCompletedEvent {
  paymentId: string;
  orderId: string;
  method: string;
  amount: number;
  providerReference?: string | null;
  paidAt?: string | Date | null;
  userId?: string | null;
  email?: string | null;
  customerName?: string | null;
}

@Injectable()
export class PaymentPublisher {
  private readonly logger = new Logger(PaymentPublisher.name);

  constructor(@Inject('PAYMENT_RMQ_CLIENT') private readonly client: ClientProxy) {}

  async publishPaymentCompleted(payload: PaymentCompletedEvent): Promise<void> {
    try {
      await this.client
        .emit('bakery.payment.completed', {
          eventName: 'bakery.payment.completed',
          occurredAt: new Date().toISOString(),
          payload,
        })
        .toPromise();

      this.logger.log(`Published bakery.payment.completed for order ${payload.orderId}`);
    } catch (error) {
      this.logger.error('Failed to publish bakery.payment.completed', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
}
