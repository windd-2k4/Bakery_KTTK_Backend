import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationConsumer } from './notification.consumer';
import { EmailService } from './email.service';

@Module({
  imports: [ConfigModule],
  controllers: [NotificationConsumer],
  providers: [EmailService],
})
export class NotificationModule {}
