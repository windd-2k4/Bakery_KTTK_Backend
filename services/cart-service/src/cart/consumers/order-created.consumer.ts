import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { CartService } from '../cart.service';

@Injectable()
export class OrderCreatedConsumer {
  private readonly logger = new Logger(OrderCreatedConsumer.name);

  constructor(private readonly cartService: CartService) {}

  @RabbitSubscribe({
    exchange: 'bakery.orders',
    routingKey: 'order.created',
    queue: 'cart.order.created',
    queueOptions: { durable: true },
  })
  async handleOrderCreated(payload: { orderId: string; userId: string }) {
    this.logger.log(
      `Order created ${payload.orderId}, clearing cart for user ${payload.userId}`,
    );
    await this.cartService.clearCart(payload.userId, 'order_created');
  }
}
