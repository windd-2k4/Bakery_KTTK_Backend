import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderStatusLog } from '../entities/order-status-log.entity';

export interface IOrderRepository {
  createOrder(data: Partial<Order>): Order;
  saveOrder(order: Order): Promise<Order>;
  findOrderById(id: string): Promise<Order | null>;
  findOrders(userId?: string): Promise<Order[]>;
  createItem(data: Partial<OrderItem>): OrderItem;
  saveItems(items: OrderItem[]): Promise<OrderItem[]>;
  createStatusLog(data: Partial<OrderStatusLog>): OrderStatusLog;
  saveStatusLog(log: OrderStatusLog): Promise<OrderStatusLog>;
  removeOrder(order: Order): Promise<Order>;
}
