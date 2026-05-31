import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { OrderStatus, TRANSITIONS } from './enums/order-status.enum';
import { OrderPublisher } from './order.publisher';
import { OrderRepository } from './repositories/order.repository';
import { CatalogAuthClient } from './clients/catalog-auth.client';

interface PreparedOrderItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderPublisher: OrderPublisher,
    private readonly catalogAuthClient: CatalogAuthClient,
    private readonly dataSource: DataSource,
  ) {}
 
  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    try {
      const user = await this.catalogAuthClient.getUserSummary(createOrderDto.userId);
      if (!user.isActive) {
        throw new BadRequestException('User account is inactive');
      }

      if (!createOrderDto.items?.length) {
        throw new BadRequestException('Order must contain at least one item');
      }

      const preparedItems: PreparedOrderItem[] = [];
      for (const item of createOrderDto.items) {
        const productSnapshot = await this.catalogAuthClient.getProductSnapshot(item.productId);
        if (!productSnapshot.isAvailable) {
          throw new BadRequestException(`Product ${item.productId} is unavailable`);
        }

        const finalPrice = item.productPrice ?? productSnapshot.price;
        preparedItems.push({
          productId: item.productId,
          productName: item.productName ?? productSnapshot.name,
          productPrice: finalPrice,
          quantity: item.quantity,
          subtotal: item.quantity * finalPrice,
        });
      }

      const calculatedTotal = preparedItems.reduce((sum, item) => sum + item.subtotal, 0);
      if (Number(createOrderDto.totalAmount) !== calculatedTotal) {
        throw new BadRequestException(
          `totalAmount mismatch. Expected ${calculatedTotal}, received ${createOrderDto.totalAmount}`,
        );
      }

      // perform atomic save in a DB transaction
      const savedOrder = await this.dataSource.transaction(async (manager) => {
        const orderRepo = manager.getRepository(Order);
        const itemRepo = manager.getRepository(OrderItem);
        const logRepo = manager.getRepository(OrderStatusLog);

        const orderEntity = orderRepo.create({
          userId: createOrderDto.userId,
          totalAmount: createOrderDto.totalAmount,
          shippingAddress: createOrderDto.shippingAddress,
          note: createOrderDto.note ?? null,
          status: OrderStatus.PENDING,
        });

        const persistedOrder = await orderRepo.save(orderEntity);

        const itemsEntities = preparedItems.map((item) =>
          itemRepo.create({
            order: persistedOrder,
            productId: item.productId,
            productName: item.productName,
            productPrice: item.productPrice,
            quantity: item.quantity,
            subtotal: item.subtotal,
          }),
        );

        const persistedItems = await itemRepo.save(itemsEntities);
        persistedOrder.items = persistedItems;

        // initial status log
        const statusLog = logRepo.create({
          orderId: persistedOrder.id,
          fromStatus: null,
          toStatus: OrderStatus.PENDING,
          changedBy: null,
          actorRole: 'SYSTEM',
          note: 'Order created',
        });
        await logRepo.save(statusLog);

        return persistedOrder;
      });

      // publish after successful commit
      await this.orderPublisher.publishOrderCreated(savedOrder);
      this.logger.log(`Order created successfully: ${savedOrder.id}`);

      return savedOrder;
    } catch (error) {
      this.logger.error('Failed to create order', error);
      throw error;
    }
  }

  async findAll(userId?: string): Promise<Order[]> {
    return this.orderRepository.findOrders(userId);
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOrderById(id);
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    if (updateOrderDto.shippingAddress) {
      order.shippingAddress = updateOrderDto.shippingAddress;
    }
    if (updateOrderDto.note) {
      order.note = updateOrderDto.note;
    }
    return this.orderRepository.saveOrder(order);
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

    const transitionConfig = TRANSITIONS[updateStatusDto.status];
    const actorRole = updateStatusDto.actorRole ?? 'SYSTEM';
    if (transitionConfig && transitionConfig.role.length > 0 && !transitionConfig.role.includes(actorRole)) {
      throw new BadRequestException(
        `Role ${actorRole} cannot transition order to ${updateStatusDto.status}`,
      );
    }

    order.status = updateStatusDto.status;

    if (updateStatusDto.status === OrderStatus.CONFIRMED) {
      order.confirmedAt = new Date();
    }
    if (updateStatusDto.status === OrderStatus.COMPLETED) {
      order.completedAt = new Date();
    }
    if (updateStatusDto.status === OrderStatus.CANCELLED) {
      order.cancelledBy = actorRole;
      order.cancelledReason = updateStatusDto.note ?? order.cancelledReason;
    }

    const updatedOrder = await this.orderRepository.saveOrder(order);
    const statusLog = this.orderRepository.createStatusLog({
      orderId: id,
      fromStatus: previousStatus,
      toStatus: updateStatusDto.status,
      changedBy: updateStatusDto.changedBy ?? null,
      actorRole,
      note: updateStatusDto.note ?? null,
    });

    await this.orderRepository.saveStatusLog(statusLog);
    await this.orderPublisher.publishStatusChanged(updatedOrder, previousStatus);
    this.logger.log(`Order ${id} status changed from ${previousStatus} to ${updateStatusDto.status}`);
    return updatedOrder;
  }

  async cancel(id: string): Promise<Order> {
    const order = await this.findOne(id);
    if ([OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(order.status)) {
      throw new BadRequestException(`Cannot cancel order in ${order.status} status`);
    }

    const previousStatus = order.status;
    order.status = OrderStatus.CANCELLED;
    order.cancelledBy = 'SYSTEM';
    const updatedOrder = await this.orderRepository.saveOrder(order);

    const statusLog = this.orderRepository.createStatusLog({
      orderId: order.id,
      fromStatus: previousStatus,
      toStatus: OrderStatus.CANCELLED,
      actorRole: 'SYSTEM',
      note: order.cancelledReason ?? 'Cancelled by system',
    });
    await this.orderRepository.saveStatusLog(statusLog);
    await this.orderPublisher.publishStatusChanged(updatedOrder, previousStatus);
    this.logger.log(`Order ${id} cancelled`);
    return updatedOrder;
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepository.removeOrder(order);
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