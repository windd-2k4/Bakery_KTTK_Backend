import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { NotificationEntity } from './entities/notification.entity';

@Injectable()
export class DynamoDBService {
  private readonly logger = new Logger(DynamoDBService.name);
  private client: DynamoDBDocumentClient;
  private readonly TABLE = 'notifications';
 
  constructor(private config: ConfigService) {
    try {
      const dynamo = new DynamoDBClient({
        region: this.config.get('AWS_REGION') || 'us-east-1',
        credentials: {
          accessKeyId: this.config.get('AWS_ACCESS_KEY_ID') || '',
          secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY') || '',
        },
      });
      this.client = DynamoDBDocumentClient.from(dynamo);
      this.logger.log('DynamoDB client initialized');
    } catch (error) {
      this.logger.error('Failed to initialize DynamoDB client', error);
    }
  }
 
  // ── LƯU NOTIFICATION ───────────────────────────────
  async save(notification: {
    userId: string; type: string;
    title: string; body: string;
    data?: Record<string, any>;
  }): Promise<string> {
    const id = `${Date.now()}-${uuidv4()}`;   // dùng timestamp để sort
    await this.client.send(new PutCommand({
      TableName: this.TABLE,
      Item: { ...notification, id, isRead: false,
              createdAt: new Date().toISOString() }
    }));
    return id;
  }
 
  // ── LẤY NOTIFICATIONS CỦA USER ────────────────────
  async getByUser(userId: string, limit = 20): Promise<NotificationEntity[]> {
    const res = await this.client.send(new QueryCommand({
      TableName: this.TABLE,
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
      Limit: limit,
      ScanIndexForward: false,   // mới nhất trước
    }));
    return (res.Items || []) as NotificationEntity[];
  }
 
  // ── ĐÁNH DẤU ĐÃ ĐỌC ───────────────────────────────
  async markAsRead(userId: string, notificationId: string) {
    await this.client.send(new UpdateCommand({
      TableName: this.TABLE,
      Key: { userId, id: notificationId },
      UpdateExpression: 'SET isRead = :val',
      ExpressionAttributeValues: { ':val': true },
    }));
    this.logger.debug(`Notification ${notificationId} marked as read for user ${userId}`);
  }

  async markAllAsRead(userId: string) {
    const notifications = await this.getByUser(userId, 1000);
    const promises = notifications.map((notif: any) =>
      this.markAsRead(userId, notif.id),
    );
    await Promise.all(promises);
    this.logger.log(`All notifications marked as read for user ${userId}`);
  }
}