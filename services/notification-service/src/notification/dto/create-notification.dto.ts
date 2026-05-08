import { IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateNotificationDto {
	@IsUUID()
	userId: string;

	@IsString()
	type: string;

	@IsString()
	title: string;

	@IsString()
	body: string;

	@IsOptional()
	@IsObject()
	data?: Record<string, any>;
}
