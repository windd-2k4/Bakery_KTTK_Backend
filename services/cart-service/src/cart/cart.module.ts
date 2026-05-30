import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RedisModule } from '@nestjs-modules/ioredis';
import { CartController } from './cart.controller';
import { CartInternalController } from './cart-internal.controller';
import { CartService } from './cart.service';
import { CartCacheService } from './cart.cache';
import { CartPublisher } from './cart.publisher';
import { ProductClient } from './clients/product.client';
import { ReviewClient } from './clients/review.client';
import { OrderCreatedConsumer } from './consumers/order-created.consumer';
import { InternalApiGuard } from './guards/internal-api.guard';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, CartItem]),
    HttpModule.register({ timeout: 5000 }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
      }),
      inject: [ConfigService],
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: configService.get<string>('REDIS_URL') || 'redis://127.0.0.1:6379',
      }),
      inject: [ConfigService],
    }),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        exchanges: [
          {
            name: 'bakery.orders',
            type: 'topic',
            options: { durable: true },
          },
        ],
        uri:
          configService.get<string>('RABBITMQ_URL') ||
          'amqp://bakery_user:bakery_pass@127.0.0.1:5672',
        connectionInitOptions: { wait: false },
      }),
    }),
  ],
  controllers: [CartController, CartInternalController],
  providers: [
    CartService,
    CartCacheService,
    CartPublisher,
    ProductClient,
    ReviewClient,
    OrderCreatedConsumer,
    InternalApiGuard,
    JwtStrategy,
  ],
  exports: [CartService],
})
export class CartModule {}
