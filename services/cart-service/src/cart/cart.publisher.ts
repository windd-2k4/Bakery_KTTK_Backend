import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class CartPublisher {
  private readonly logger = new Logger(CartPublisher.name);

  constructor(private readonly amqpConnection: AmqpConnection) {}

  async publishItemAdded(payload: {
    userId: string;
    productId: string;
    quantity: number;
    cartId: string;
  }): Promise<void> {
    await this.publish('cart.item.added', payload);
  }

  async publishCartCleared(payload: {
    userId: string;
    cartId: string;
    reason: 'checkout' | 'manual' | 'order_created';
  }): Promise<void> {
    await this.publish('cart.cleared', payload);
  }

  private async publish(routingKey: string, payload: unknown): Promise<void> {
    try {
      await this.amqpConnection.publish('bakery.orders', routingKey, payload);
      this.logger.log(`Published ${routingKey}`);
    } catch (error) {
      this.logger.warn(
        `Failed to publish ${routingKey}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
