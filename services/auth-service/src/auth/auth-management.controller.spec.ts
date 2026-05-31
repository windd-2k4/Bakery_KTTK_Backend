/**
 * Auth Management Controller Unit Test Example
 * 
 * Usage: npm test or npm run test:watch
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthManagementController } from './auth-management.controller';
import { AuthService } from './auth.service';
import { AuthenticationRequest } from './dto/authentication-request.dto';
import { AuthenticationResponse } from './dto/authentication-response.dto';
import { LogoutRequest } from './dto/logout-request.dto';

describe('AuthManagementController', () => {
  let controller: AuthManagementController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthManagementController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            authenticate: jest.fn(),
            logout: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthManagementController>(AuthManagementController);
    service = module.get<AuthService>(AuthService);
  });

  describe('logIn', () => {
    it('should return ApiResponse with tokens on successful login', async () => {
      const authRequest: AuthenticationRequest = {
        identifier: 'user@example.com',
        password: 'password123',
      };

      const mockResponse: AuthenticationResponse = {
        accessToken: 'eyJhbGc...',
        refreshToken: 'eyJhbGc...',
        authenticated: true,
      };

      jest.spyOn(service, 'authenticate').mockResolvedValue(mockResponse);

      const result = await controller.logIn(authRequest);

      expect(result).toEqual({
        code: 200,
        message: 'Login successful',
        data: mockResponse,
      });

      expect(service.authenticate).toHaveBeenCalledWith(authRequest);
    });

    it('should throw BadRequestException when identifier is missing', async () => {
      const authRequest: any = {
        identifier: '',
        password: 'password123',
      };

      await expect(controller.logIn(authRequest)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      const authRequest: AuthenticationRequest = {
        identifier: 'user@example.com',
        password: 'wrongpassword',
      };

      jest
        .spyOn(service, 'authenticate')
        .mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(controller.logIn(authRequest)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logOut', () => {
    it('should return ApiResponse on successful logout', async () => {
      const logoutRequest: LogoutRequest = {
        userId: '1234567890',
      };

      jest.spyOn(service, 'logout').mockResolvedValue(undefined);

      const result = await controller.logOut(logoutRequest);

      expect(result).toEqual({
        code: 200,
        message: 'Logout successful',
        data: { message: 'User logged out successfully' },
      });

      expect(service.logout).toHaveBeenCalledWith(logoutRequest.userId);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const logoutRequest: LogoutRequest = {
        userId: 'nonexistent',
      };

      jest
        .spyOn(service, 'logout')
        .mockRejectedValue(new UnauthorizedException('User not found'));

      await expect(controller.logOut(logoutRequest)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

/**
 * Example Integration Test with REST endpoints
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';

describe('Auth Management (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Import your AppModule here
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth-management/api/v1/auth/log-in', () => {
    it('should login and return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth-management/api/v1/auth/log-in')
        .send({
          identifier: 'user@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toEqual({
        code: 200,
        message: 'Login successful',
        data: expect.objectContaining({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          authenticated: true,
        }),
      });
    });

    it('should return 401 on invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth-management/api/v1/auth/log-in')
        .send({
          identifier: 'user@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toEqual({
        code: 401,
        message: expect.any(String),
        data: null,
      });
    });

    it('should return 400 on missing identifier', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth-management/api/v1/auth/log-in')
        .send({
          password: 'password123',
        })
        .expect(400);

      expect(response.body.code).toBe(400);
      expect(response.body.message).toContain('identifier');
    });
  });

  describe('POST /auth-management/api/v1/auth/log-out', () => {
    let accessToken: string;

    beforeAll(async () => {
      // First login to get token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth-management/api/v1/auth/log-in')
        .send({
          identifier: 'user@example.com',
          password: 'password123',
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should logout with valid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth-management/api/v1/auth/log-out')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: '1234567890',
        })
        .expect(200);

      expect(response.body).toEqual({
        code: 200,
        message: 'Logout successful',
        data: {
          message: 'User logged out successfully',
        },
      });
    });

    it('should return 401 without token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth-management/api/v1/auth/log-out')
        .send({
          userId: '1234567890',
        })
        .expect(401);

      expect(response.body.code).toBe(401);
    });
  });
});
