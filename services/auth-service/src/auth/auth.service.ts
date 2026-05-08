import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthenticationRequest } from './dto/authentication-request.dto';
import { AuthenticationResponse } from './dto/authentication-response.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Register new user (legacy endpoint)
   */
  async register(dto: RegisterDto) {
    try {
      console.log(`[AuthService] Processing registration for email: ${dto.email}`);
      const hashedPassword = await bcrypt.hash(dto.password, 12);
      
      let fullName = dto.fullName;
      const firstName = dto.firstName;
      const lastName = dto.lastName;

      if (!fullName && firstName && lastName) {
        fullName = `${firstName} ${lastName}`;
      } else if (!fullName) {
        fullName = dto.email.split('@')[0];
      }

      const user = await this.usersService.create({
        email: dto.email,
        password: hashedPassword,
        firstName,
        lastName,
        fullName,
        phone: dto.phone,
        role: dto.role || 'CUSTOMER',
      });
      
      const { accessToken, refreshToken } = this.generateTokens(user);
      await this.usersService.updateRefreshToken(user.id, refreshToken);
      
      return {
        accessToken,
        refreshToken,
        authenticated: true,
      };
    } catch (error) {
      console.error('[AuthService] Lỗi khi lưu vào Database:', error);
      if (error.code === '23505') {
        throw new InternalServerErrorException('Email đã tồn tại trong hệ thống');
      }
      throw new InternalServerErrorException(error.message || 'Database error while creating user');
    }
  }

  /**
   * Login with email (legacy endpoint)
   */
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const { accessToken, refreshToken } = this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, refreshToken);
    
    return {
      accessToken,
      refreshToken,
      authenticated: true,
    };
  }

  /**
   * Authenticate with identifier (email or username) - NEW endpoint
   */
  async authenticate(
    authRequest: AuthenticationRequest,
  ): Promise<AuthenticationResponse> {
    const user = await this.usersService.findByEmail(authRequest.identifier);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      authRequest.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = this.generateTokens(user);

    // Lưu refreshToken vào database
    await this.usersService.updateRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      authenticated: true,
    };
  }

  /**
   * Logout user
   */
  async logout(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Xóa refreshToken khỏi database
    await this.usersService.updateRefreshToken(userId, null);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthenticationResponse> {
    try {
      // Verify the refresh token
      const payload = this.jwtService.verify(refreshToken);
      
      // Get user from database
      const user = await this.usersService.findById(payload.sub);
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Verify that the stored refresh token matches the provided one
      if (user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user);
      
      // Save the new refresh token to database
      await this.usersService.updateRefreshToken(user.id, newRefreshToken);
      
      return {
        accessToken,
        refreshToken: newRefreshToken,
        authenticated: true,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }
}