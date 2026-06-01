import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Payment } from './entities/payment.entity';
import { PaymentPublisher } from './publishers/payment.publisher';
import { SepayStrategy } from './strategies/sepay.strategy';
import { StripeStrategy } from './strategies/stripe.strategy';
import { VnpayStrategy } from './strategies/vnpay.strategy';
import { OrderClient } from './clients/order.client';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Payment]),
    ClientsModule.registerAsync([
      {
        name: 'PAYMENT_RMQ_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const url = configService.get<string>('RABBITMQ_URL') ?? 'amqp://bakery_user:bakery_pass@localhost:5672';
          return {
            transport: Transport.RMQ,
            options: {
              urls: [url],
              queue: configService.get<string>('RABBITMQ_PAYMENT_QUEUE') ?? 'bakery.payment.queue',
              queueOptions: {
                durable: true,
              },
            },
          };
        },
      },
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentPublisher, StripeStrategy, SepayStrategy, VnpayStrategy, OrderClient],
  exports: [PaymentService, PaymentPublisher],
})
export class PaymentModule {}
