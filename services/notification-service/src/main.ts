import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), NotificationModule],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const rabbitUrl = configService.get<string>('RABBITMQ_URL') ?? 'amqp://bakery_user:bakery_pass@localhost:5672';
  const queue = configService.get<string>('RABBITMQ_NOTIFICATION_QUEUE') ?? 'bakery.notification.queue';

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitUrl],
      queue,
      queueOptions: {
        durable: true,
      },
      noAck: false,
    },
  });

  await app.startAllMicroservices();
  const port = Number(configService.get<string>('PORT') ?? 3008);
  await app.listen(port);
  console.log(`Notification Service running on port ${port}`);
}

bootstrap();
