import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class AuthenticationRequest {
  @IsString()
  @IsNotEmpty()
  identifier: string; // email hoặc username

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
