import {
  Body,
  Controller,
  Post,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticationRequest } from './dto/authentication-request.dto';
import { AuthenticationResponse } from './dto/authentication-response.dto';
import { LogoutRequest } from './dto/logout-request.dto';
import type { ApiResponse } from '../common/interfaces/response.interface';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth-management/api/v1/auth')
export class AuthManagementController {
  constructor(private readonly authService: AuthService) {}

  @Post('log-in')
  async logIn(
    @Body() authRequest: AuthenticationRequest,
  ): Promise<ApiResponse<AuthenticationResponse>> {
    if (!authRequest.identifier || !authRequest.password) {
      throw new BadRequestException('Identifier and password are required');
    }

    const result = await this.authService.authenticate(authRequest);

    return {
      code: 200,
      message: 'Login successful',
      data: result,
    };
  }

  @Post('log-out')
  @UseGuards(JwtAuthGuard)
  async logOut(
    @Body() logoutRequest: LogoutRequest,
  ): Promise<ApiResponse<{ message: string }>> {
    await this.authService.logout(logoutRequest.userId);

    return {
      code: 200,
      message: 'Logout successful',
      data: { message: 'User logged out successfully' },
    };
  }
}
