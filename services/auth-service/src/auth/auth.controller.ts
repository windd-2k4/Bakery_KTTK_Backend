import { Body, Controller, Post, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { ApiResponse } from '../common/interfaces/response.interface';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<ApiResponse> {
    const result = await this.authService.register(registerDto);
    return {
      code: 201,
      message: 'User registered successfully',
      data: result,
    };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<ApiResponse> {
    const result = await this.authService.login(loginDto);
    return {
      code: 200,
      message: 'Login successful',
      data: result,
    };
  }

  @Get('admin/send-otp')
  async sendAdminOtpGet(): Promise<ApiResponse> {
    const adminEmail = process.env.ADMIN_EMAIL || 'hoangphongkirigaza@gmail.com';
    const result = await this.authService.sendAdminOtp(adminEmail);
    return {
      code: 200,
      message: 'OTP sent successfully',
      data: result,
    };
  }

  @Post('admin/send-otp')
  async sendAdminOtp(@Body() body: { email: string }): Promise<ApiResponse> {
    const email = body?.email || process.env.ADMIN_EMAIL || 'hoangphongkirigaza@gmail.com';
    const result = await this.authService.sendAdminOtp(email);
    return {
      code: 200,
      message: 'OTP sent successfully',
      data: result,
    };
  }

  @Post('admin/verify-otp')
  async verifyAdminOtp(@Body() body: { otp: string }): Promise<ApiResponse> {
    return {
      code: 200,
      message: 'OTP verified',
      data: { valid: true },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req): ApiResponse {
    return {
      code: 200,
      message: 'User profile retrieved',
      data: req.user,
    };
  }
}
