import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { NotificationService } from '../notification.service';

@Injectable()
export class PaymentConsumer {
  private readonly logger = new Logger(PaymentConsumer.name);

  constructor(private notificationService: NotificationService) {}

  // Lắng nghe queue 'payment.success'
  @RabbitSubscribe({
    exchange: 'bakery.payments',
    routingKey: 'payment.success',
    queue: 'payment.success',
  })
  async handlePaymentSuccess(payload: {
    paymentId: string;
    userId: string;
    orderId: string;
    amount: number;
    method: string;
  }) {
    this.logger.log(`Payment success event received: ${payload.paymentId}`);
    await this.notificationService.send({
      userId: payload.userId,
      type: 'PAYMENT_SUCCESS',
      title: 'Thanh toán thành công! ✅',
      body: `Thanh toán ${payload.amount.toLocaleString('vi-VN')}đ qua ${payload.method} đã được xác nhận.`,
      data: { paymentId: payload.paymentId, orderId: payload.orderId, method: payload.method },
    });
  }

  // Lắng nghe queue 'payment.failed'
  @RabbitSubscribe({
    exchange: 'bakery.payments',
    routingKey: 'payment.failed',
    queue: 'payment.failed',
  })
  async handlePaymentFailed(payload: {
    paymentId: string;
    userId: string;
    orderId: string;
    amount: number;
    reason: string;
  }) {
    this.logger.log(`Payment failed event received: ${payload.paymentId}`);
    await this.notificationService.send({
      userId: payload.userId,
      type: 'PAYMENT_FAILED',
      title: 'Thanh toán không thành công ❌',
      body: `Thanh toán ${payload.amount.toLocaleString('vi-VN')}đ thất bại: ${payload.reason}. Vui lòng thử lại.`,
      data: { paymentId: payload.paymentId, orderId: payload.orderId, reason: payload.reason },
    });
  }

  // Lắng nghe queue 'payment.refunded'
  @RabbitSubscribe({
    exchange: 'bakery.payments',
    routingKey: 'payment.refunded',
    queue: 'payment.refunded',
  })
  async handlePaymentRefunded(payload: {
    paymentId: string;
    userId: string;
    orderId: string;
    amount: number;
  }) {
    this.logger.log(`Payment refunded event received: ${payload.paymentId}`);
    await this.notificationService.send({
      userId: payload.userId,
      type: 'PAYMENT_REFUNDED',
      title: 'Hoàn tiền thành công! 💰',
      body: `Hoàn tiền ${payload.amount.toLocaleString('vi-VN')}đ đã được xử lý. Bạn sẽ nhận được trong 3-5 ngày làm việc.`,
      data: { paymentId: payload.paymentId, orderId: payload.orderId, amount: payload.amount },
    });
  }
}
