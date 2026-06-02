import { Injectable, UnauthorizedException, InternalServerErrorException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthenticationRequest } from './dto/authentication-request.dto';
import { AuthenticationResponse } from './dto/authentication-response.dto';
import { User } from '../users/entities/user.entity';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject('AUTH_NOTIFICATION_CLIENT') private readonly notificationClient: ClientProxy,
  ) {}

  /**
   * Register new user (legacy endpoint)
   */
  async register(dto: RegisterDto) {
    try {
      console.log(`[AuthService] Processing registration for email: ${dto.email}`);
      const username = this.resolveUsername(dto.email, dto.username);

      const existingByEmail = await this.usersService.findByEmail(dto.email.toLowerCase());
      if (existingByEmail) {
        throw new ConflictException('Email đã tồn tại trong hệ thống');
      }

      const existingByUsername = username ? await this.usersService.findByUsername(username) : null;
      if (existingByUsername) {
        throw new ConflictException('Username đã tồn tại trong hệ thống');
      }

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
        username,
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
      if (error instanceof ConflictException) {
        throw error;
      }
      if (error.code === '23505') {
        throw new InternalServerErrorException('Email đã tồn tại trong hệ thống');
      }
      throw new InternalServerErrorException(error.message || 'Database error while creating user');
    }
  }

  async sendAdminOtp(email: string): Promise<{ success: boolean }> {
    try {
      const otp = this.generateOtp();
      await this.notificationClient.emit('auth.otp.generated', { email, otp }).toPromise();
      return { success: true };
    } catch (error) {
      throw new InternalServerErrorException(error instanceof Error ? error.message : 'Unable to send OTP');
    }
  }

  /**
   * Login with email (legacy endpoint)
   */
  async login(dto: LoginDto) {
    const user = await this.usersService.findByIdentifier((dto as any).identifier || dto.email);
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
    const user = await this.usersService.findByIdentifier(authRequest.identifier);

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

  async authenticateGoogle(payload: { token?: string; code?: string }): Promise<AuthenticationResponse> {
    const rawToken = payload.token || payload.code;
    if (!rawToken) {
      throw new BadRequestException('Google token is required');
    }

    const googleProfile = this.decodeJwtPayload(rawToken);
    const email = (googleProfile.email || '').toLowerCase();

    if (!email) {
      throw new UnauthorizedException('Invalid Google token');
    }

    let user = await this.usersService.findByEmail(email);
    if (!user) {
      const username = this.resolveUsername(email, googleProfile.preferred_username || googleProfile.name);
      const fullName = googleProfile.name || [googleProfile.given_name, googleProfile.family_name].filter(Boolean).join(' ') || email.split('@')[0];

      user = await this.usersService.create({
        email,
        username,
        password: await bcrypt.hash(cryptoRandomPassword(), 12),
        fullName,
        firstName: googleProfile.given_name,
        lastName: googleProfile.family_name,
        role: 'CUSTOMER',
      });
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

  private resolveUsername(email: string, fallback?: string | null): string {
    const normalizedFallback = (fallback || '').trim().toLowerCase().replace(/\s+/g, '.');
    const fromEmail = email.split('@')[0].trim().toLowerCase();
    return normalizedFallback || fromEmail;
  }

  private decodeJwtPayload(token: string): any {
    const parts = token.split('.');
    if (parts.length < 2) {
      return {};
    }

    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
    } catch {
      return {};
    }
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

function cryptoRandomPassword(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
