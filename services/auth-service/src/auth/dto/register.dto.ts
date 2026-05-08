import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-ZÀ-ỿ\s'-]*$/, { message: 'First name can only contain letters and spaces' })
  firstName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-ZÀ-ỿ\s'-]*$/, { message: 'Last name can only contain letters and spaces' })
  lastName?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[0-9\s\-\(\)]*$/, { message: 'Phone number format is invalid' })
  phone?: string;

  @IsString()
  @IsOptional()
  role?: 'CUSTOMER' | 'ADMIN' | 'BAKER';
}
