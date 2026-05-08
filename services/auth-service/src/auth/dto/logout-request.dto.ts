import { IsUUID, IsNotEmpty } from 'class-validator';

export class LogoutRequest {
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}
