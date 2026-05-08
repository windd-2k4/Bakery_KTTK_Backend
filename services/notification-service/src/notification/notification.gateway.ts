import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationGateway.name);
 
  @WebSocketServer() server: Server;
 
  // Map userId → socketId để gửi đúng client
  private userSockets = new Map<string, string>();
 
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    const userId = client.handshake.auth?.userId;
    if (userId) {
      this.userSockets.set(userId, client.id);
      client.join(`user:${userId}`);  // join room theo userId
      this.logger.log(`User ${userId} joined notification room`);
    }
  }
 
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    for (const [userId, socketId] of this.userSockets) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        this.logger.log(`User ${userId} left notification room`);
        break;
      }
    }
  }
 
  // Gọi method này từ NotificationService
  pushToUser(userId: string, event: string, data: any) {
    this.logger.debug(`Pushing event ${event} to user ${userId}`);
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
