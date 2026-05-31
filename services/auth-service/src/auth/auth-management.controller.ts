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
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenRequest } from './dto/refresh-token-request.dto';
import type { ApiResponse } from '../common/interfaces/response.interface';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

class GoogleAuthRequest {
  token?: string;
  code?: string;
}

@Controller('auth-management/api/v1/auth')
export class AuthManagementController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<ApiResponse<AuthenticationResponse>> {
    if (!registerDto.email || !registerDto.password) {
      throw new BadRequestException('Email and password are required');
    }

    const result = await this.authService.register(registerDto);

    return {
      code: 201,
      message: 'User registered successfully',
      data: result,
    };
  }

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

  @Post('google')
  async googleLogin(
    @Body() payload: GoogleAuthRequest,
  ): Promise<ApiResponse<AuthenticationResponse>> {
    const result = await this.authService.authenticateGoogle(payload);

    return {
      code: 200,
      message: 'Google login successful',
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

  @Post('refresh')
  async refresh(
    @Body() refreshTokenRequest: RefreshTokenRequest,
  ): Promise<ApiResponse<AuthenticationResponse>> {
    if (!refreshTokenRequest.refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const result = await this.authService.refreshToken(
      refreshTokenRequest.refreshToken,
    );

    return {
      code: 200,
      message: 'Token refreshed successfully',
      data: result,
    };
  }
}
