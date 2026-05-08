import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { DynamoDBService } from './dynamodb.service';
import { MailService } from './mail.service';
import { OrderConsumer } from './consumers/order.consumer';
import { PaymentConsumer } from './consumers/payment.consumer';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
          {
            name: 'bakery.payments',
            type: 'topic',
            options: { durable: true },
          },
        ],
        uri: configService.get('RABBITMQ_URL') || 'amqp://guest:guest@rabbitmq:5672',
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get('MAIL_HOST') || 'smtp.gmail.com',
          port: configService.get('MAIL_PORT') || 587,
          secure: configService.get('MAIL_SECURE') === 'true',
          auth: {
            user: configService.get('MAIL_USER'),
            pass: configService.get('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: `no-reply@${configService.get('MAIL_FROM_NAME') || 'bakery.local'}`,
        },
      }),
    }),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationGateway,
    DynamoDBService,
    MailService,
    OrderConsumer,
    PaymentConsumer,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
