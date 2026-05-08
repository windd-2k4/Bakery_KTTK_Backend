import { Injectable } from '@nestjs/common';
import { DynamoDBService } from './dynamodb.service';
import { MailService } from './mail.service';
import { NotificationGateway } from './notification.gateway';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ApiResponse } from '../common/api-response';
import { NotificationEntity } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    private readonly dynamoDB: DynamoDBService,
    private readonly mailService: MailService,
    private readonly gateway: NotificationGateway,
  ) {}

  async send(payload: {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, any>;
  }): Promise<ApiResponse<NotificationEntity>> {
    const id = await this.dynamoDB.save(payload);
    const createdNotification: NotificationEntity = {
      id,
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    this.gateway.pushToUser(payload.userId, 'notification', createdNotification);

    if (['ORDER_CREATED', 'ORDER_STATUS'].includes(payload.type)) {
      await this.mailService.sendOrderNotification(payload);
    }

    if (['PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PAYMENT_REFUNDED'].includes(payload.type)) {
      await this.mailService.sendPaymentNotification(payload);
    }

    return ApiResponse.success(createdNotification, 'Notification sent', 201);
  }

  async create(dto: CreateNotificationDto): Promise<ApiResponse<NotificationEntity>> {
    return this.send(dto);
  }

  async getByUser(userId: string, limit = 20): Promise<ApiResponse<NotificationEntity[]>> {
    const items = await this.dynamoDB.getByUser(userId, limit);
    return ApiResponse.success(items, 'Notifications fetched');
  }

  async markAsRead(userId: string, id: string): Promise<ApiResponse<{ updated: boolean }>> {
    await this.dynamoDB.markAsRead(userId, id);
    return ApiResponse.success({ updated: true }, 'Notification marked as read');
  }

  async markAllAsRead(userId: string): Promise<ApiResponse<{ updated: boolean }>> {
    await this.dynamoDB.markAllAsRead(userId);
    return ApiResponse.success({ updated: true }, 'All notifications marked as read');
  }
}