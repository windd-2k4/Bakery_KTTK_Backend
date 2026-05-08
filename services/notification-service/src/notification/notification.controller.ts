import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('notifications')
export class NotificationController {
	constructor(private readonly notificationService: NotificationService) {}

	@Post()
	create(@Body() dto: CreateNotificationDto) {
		return this.notificationService.create(dto);
	}

	@Get('users/:userId')
	findByUser(
		@Param('userId') userId: string,
		@Query('limit') limit?: string,
	) {
		return this.notificationService.getByUser(userId, limit ? Number(limit) : 20);
	}

	@Patch('users/:userId/:id/read')
	markAsRead(@Param('userId') userId: string, @Param('id') id: string) {
		return this.notificationService.markAsRead(userId, id);
	}

	@Patch('users/:userId/read-all')
	markAllAsRead(@Param('userId') userId: string) {
		return this.notificationService.markAllAsRead(userId);
	}
}
