import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrderModule } from './order/order.module';
import { Order } from './order/entities/order.entity';
import { OrderItem } from './order/entities/order-item.entity';
import { OrderStatusLog } from './order/entities/order-status-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.ORDER_DATABASE_URL || process.env.DATABASE_URL || undefined,
      host: process.env.ORDER_DB_HOST || process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.ORDER_DB_PORT || process.env.DB_PORT || '5432', 10),
      username: process.env.ORDER_DB_USERNAME || process.env.DB_USERNAME || 'bakery_user',
      password: process.env.ORDER_DB_PASSWORD || process.env.DB_PASSWORD || 'bakery_pass',
      database: process.env.ORDER_DB_DATABASE || process.env.DB_DATABASE || 'bakery_order_db',
      schema: process.env.ORDER_DB_SCHEMA || process.env.DB_SCHEMA || 'public',
      entities: [Order, OrderItem, OrderStatusLog],
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
    }),
    OrderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
