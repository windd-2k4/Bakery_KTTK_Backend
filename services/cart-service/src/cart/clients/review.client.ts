import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface InternalUserInfo {
  id: string;
  email?: string;
  fullName?: string;
}

@Injectable()
export class ReviewClient {
  private readonly logger = new Logger(ReviewClient.name);
  private readonly baseUrl: string;
  private readonly enabled: boolean;

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService,
  ) {
    this.baseUrl =
      configService.get<string>('REVIEW_SERVICE_URL') ||
      'http://127.0.0.1:3007';
    this.enabled = configService.get<string>('USER_VERIFY_ENABLED') === 'true';
  }

  async verifyUser(userId: string): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      await firstValueFrom(
        this.httpService.get<InternalUserInfo>(
          `${this.baseUrl}/internal/users/${userId}`,
          { timeout: 5000 },
        ),
      );
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;

      if (status === 404) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      this.logger.warn(
        `Review service unavailable, skipping user verification for ${userId}`,
      );
    }
  }
}
