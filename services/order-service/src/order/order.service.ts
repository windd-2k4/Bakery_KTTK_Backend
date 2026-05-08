import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusLog } from './entities/order-status-log.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { OrderStatus, TRANSITIONS } from './enums/order-status.enum';
import { OrderPublisher } from './order.publisher';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(OrderStatusLog)
    private statusLogRepository: Repository<OrderStatusLog>,
    private orderPublisher: OrderPublisher,
  ) {}
 
  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    try {
      const order = this.orderRepository.create({
        userId: createOrderDto.userId,
        totalAmount: createOrderDto.totalAmount,
        shippingAddress: createOrderDto.shippingAddress as any,
        note: createOrderDto.notes,
        status: OrderStatus.PENDING,
      });

      const savedOrder = await this.orderRepository.save(order);

      if (createOrderDto.items && createOrderDto.items.length > 0) {
        const items = createOrderDto.items.map((item) =>
          this.orderItemRepository.create({
            order: savedOrder,
            productId: item.productId,
            productPrice: item.unitPrice,
            quantity: item.quantity,
            subtotal: item.quantity * item.unitPrice,
          }),
        );
        savedOrder.items = await this.orderItemRepository.save(items);
      }

      await this.orderPublisher.publishOrderCreated(savedOrder);
      this.logger.log(`Order created successfully: ${savedOrder.id}`);

      return savedOrder;
    } catch (error) {
      this.logger.error('Failed to create order', error);
      throw error;
    }
  }

  async findAll(userId?: string): Promise<Order[]> {
    const query = this.orderRepository.createQueryBuilder('order').leftJoinAndSelect('order.items', 'items');
    if (userId) {
      query.where('order.userId = :userId', { userId });
    }
    return query.orderBy('order.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'statusLogs'],
    });
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    if (updateOrderDto.shippingAddress) {
      order.shippingAddress = updateOrderDto.shippingAddress as any;
    }
    if (updateOrderDto.note) {
      order.note = updateOrderDto.note;
    }
    return this.orderRepository.save(order);
  }
 
  async updateStatus(id: string, updateStatusDto: UpdateStatusDto): Promise<Order> {
    const order = await this.findOne(id);
    const previousStatus = order.status;
    const validTransitions = this.getValidTransitions(previousStatus);
    if (!validTransitions.includes(updateStatusDto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${previousStatus} to ${updateStatusDto.status}. Valid transitions: ${validTransitions.join(', ')}`,
      );
    }
    order.status = updateStatusDto.status;
    const updatedOrder = await this.orderRepository.save(order);
    const statusLog = this.statusLogRepository.create({
      orderId: id,
      fromStatus: previousStatus,
      toStatus: updateStatusDto.status,
      note: updateStatusDto.notes,
    });
    await this.statusLogRepository.save(statusLog);
    await this.orderPublisher.publishStatusChanged(updatedOrder);
    this.logger.log(`Order ${id} status changed from ${previousStatus} to ${updateStatusDto.status}`);
    return updatedOrder;
  }

  async cancel(id: string): Promise<Order> {
    const order = await this.findOne(id);
    if ([OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(order.status)) {
      throw new BadRequestException(`Cannot cancel order in ${order.status} status`);
    }
    order.status = OrderStatus.CANCELLED;
    const updatedOrder = await this.orderRepository.save(order);
    await this.orderPublisher.publishStatusChanged(updatedOrder);
    this.logger.log(`Order ${id} cancelled`);
    return updatedOrder;
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepository.remove(order);
    this.logger.log(`Order ${id} deleted`);
  }

  private getValidTransitions(currentStatus: OrderStatus): OrderStatus[] {
    // Build allowed transitions from TRANSITIONS map exported by the enum module
    const allowed: OrderStatus[] = [];
    Object.keys(TRANSITIONS).forEach((to) => {
      const cfg = TRANSITIONS[to as keyof typeof TRANSITIONS];
      if (cfg.from.includes(currentStatus)) allowed.push(to as OrderStatus);
    });
    return allowed;
  }
}