export interface NotificationEntity {
	userId: string;
	id: string;
	type: string;
	title: string;
	body: string;
	data?: Record<string, any>;
	isRead: boolean;
	createdAt: string;
}
