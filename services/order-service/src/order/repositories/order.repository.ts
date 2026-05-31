import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderStatusLog } from '../entities/order-status-log.entity';
import { IOrderRepository } from './order.repository.contract';

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly orderOrmRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemOrmRepo: Repository<OrderItem>,
    @InjectRepository(OrderStatusLog)
    private readonly logOrmRepo: Repository<OrderStatusLog>,
  ) {}

  createOrder(data: Partial<Order>): Order {
    return this.orderOrmRepo.create(data);
  }

  saveOrder(order: Order): Promise<Order> {
    return this.orderOrmRepo.save(order);
  }

  async findOrderById(id: string): Promise<Order | null> {
    return this.orderOrmRepo.findOne({
      where: { id },
      relations: ['items', 'statusLogs'],
    });
  }

  async findOrders(userId?: string): Promise<Order[]> {
    const query = this.orderOrmRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .orderBy('order.createdAt', 'DESC');

    if (userId) {
      query.where('order.userId = :userId', { userId });
    }

    return query.getMany();
  }

  createItem(data: Partial<OrderItem>): OrderItem {
    return this.itemOrmRepo.create(data);
  }

  saveItems(items: OrderItem[]): Promise<OrderItem[]> {
    return this.itemOrmRepo.save(items);
  }

  createStatusLog(data: Partial<OrderStatusLog>): OrderStatusLog {
    return this.logOrmRepo.create(data);
  }

  saveStatusLog(log: OrderStatusLog): Promise<OrderStatusLog> {
    return this.logOrmRepo.save(log);
  }

  removeOrder(order: Order): Promise<Order> {
    return this.orderOrmRepo.remove(order);
  }
}
