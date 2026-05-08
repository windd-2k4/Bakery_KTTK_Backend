import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderPublisher } from './order.publisher';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusLog } from './entities/order-status-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, OrderStatusLog])],
  controllers: [OrderController],
  providers: [OrderService, OrderPublisher],
  exports: [OrderService],
})
export class OrderModule {}
