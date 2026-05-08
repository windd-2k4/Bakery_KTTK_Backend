import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { NotificationService } from '../notification.service';

@Injectable()
export class OrderConsumer {
  private readonly logger = new Logger(OrderConsumer.name);

  constructor(private notificationService: NotificationService) {}
 
  // Lắng nghe queue 'order.created'
  @RabbitSubscribe({
    exchange:   'bakery.orders',
    routingKey: 'order.created',
    queue:      'order.created',
  })
  async handleOrderCreated(payload: {
    orderId: string; userId: string; total: number
  }) {
    this.logger.log(`Order created event received: ${payload.orderId}`);
    await this.notificationService.send({
      userId: payload.userId,
      type:   'ORDER_CREATED',
      title:  'Đặt hàng thành công! 🎉',
      body:   `Đơn hàng #${payload.orderId.slice(-6)} đã được tạo.`,
      data:   { orderId: payload.orderId, total: payload.total },
    });
  }
 
  // Lắng nghe queue 'order.status.changed'
  @RabbitSubscribe({
    exchange:   'bakery.orders',
    routingKey: 'order.status.*',
    queue:      'order.status.changed',
  })
  async handleStatusChanged(payload: {
    orderId: string; userId: string; newStatus: string
  }) {
    this.logger.log(`Order status changed event received: ${payload.orderId} → ${payload.newStatus}`);
    const messages: Record<string, string> = {
      CONFIRMED: 'Đơn hàng đã được xác nhận ✅',
      BAKING:    'Bánh đang được làm 👨‍🍳',
      READY:     'Bánh đã sẵn sàng! Đang giao đến bạn 🚀',
      COMPLETED: 'Cảm ơn bạn đã mua hàng! ❤️',
    };
    await this.notificationService.send({
      userId: payload.userId,
      type:   'ORDER_STATUS',
      title:  messages[payload.newStatus] || 'Cập nhật đơn hàng',
      body:   `Đơn #${payload.orderId.slice(-6)}: ${payload.newStatus}`,
      data:   payload,
    });
  }
}
