import { Injectable, Logger } from '@nestjs/common';
import { Order } from './entities/order.entity';

@Injectable()
export class OrderPublisher {
  private readonly logger = new Logger(OrderPublisher.name);

  // Try to publish via a global amqpConnection if available (optional runtime integration).
  private async publishToBroker(routingKey: string, payload: any) {
    const conn = (global as any).amqpConnection;
    if (conn && typeof conn.publish === 'function') {
      try {
        await conn.publish('bakery.orders', routingKey, payload);
        return;
      } catch (err) {
        this.logger.error('Failed to publish to broker', err);
      }
    }
    // Fallback: log the event so local dev and tests still see it
    this.logger.log(`Event ${routingKey}: ${JSON.stringify(payload)}`);
  }

  async publishOrderCreated(order: Order) {
    await this.publishToBroker('order.created', {
      orderId:   order.id,
      userId:    order.userId,
      total:     order.totalAmount,
      status:    order.status,
      createdAt: order.createdAt,
    });
  }

  async publishStatusChanged(order: Order) {
    await this.publishToBroker('order.status.changed', {
      orderId:   order.id,
      userId:    order.userId,
      newStatus: order.status,
      updatedAt: order.updatedAt,
    });
  }
}