import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { EmailService, OrderConfirmationEmailPayload } from './email.service';

interface AuthOtpGeneratedPayload {
  email: string;
  otp: string;
}

interface PaymentCompletedPayload {
  paymentId: string;
  orderId: string;
  method: string;
  amount: number;
  providerReference?: string | null;
  paidAt?: string | Date | null;
  email?: string;
  customerName?: string;
  userId?: string;
}

@Controller()
export class NotificationConsumer {
  private readonly logger = new Logger(NotificationConsumer.name);

  constructor(private readonly emailService: EmailService) {}

  @EventPattern('auth.otp.generated')
  async handleAuthOtpGenerated(@Payload() payload: AuthOtpGeneratedPayload, @Ctx() context: RmqContext): Promise<void> {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    try {
      if (!payload?.email || !payload?.otp) {
        throw new Error('Invalid auth.otp.generated payload');
      }

      await this.emailService.sendAdminOTP(payload.email, payload.otp);
      channel.ack(message);
      this.logger.log(`OTP processed for ${payload.email}`);
    } catch (error) {
      this.logger.error('Failed to handle auth.otp.generated event', error instanceof Error ? error.stack : String(error));
      channel.nack(message, false, false);
    }
  }

  @EventPattern('bakery.payment.completed')
  async handlePaymentCompleted(@Payload() payload: PaymentCompletedPayload, @Ctx() context: RmqContext): Promise<void> {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    try {
      if (!payload?.orderId || typeof payload.amount !== 'number') {
        throw new Error('Invalid bakery.payment.completed payload');
      }

      const email = payload.email;
      if (!email) {
        this.logger.warn(`Skip order confirmation email because email is missing for order ${payload.orderId}`);
        channel.ack(message);
        return;
      }

      const emailPayload: OrderConfirmationEmailPayload = {
        email,
        orderId: payload.orderId,
        customerName: payload.customerName,
        totalAmount: payload.amount,
        paymentMethod: payload.method,
      };

      await this.emailService.sendOrderConfirmation(emailPayload);
      channel.ack(message);
      this.logger.log(`Order confirmation processed for order ${payload.orderId}`);
    } catch (error) {
      this.logger.error('Failed to handle bakery.payment.completed event', error instanceof Error ? error.stack : String(error));
      channel.nack(message, false, false);
    }
  }
}
