import {
  BadGatewayException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ProductSnapshot {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

interface UserSummary {
  id: string;
  isActive: boolean;
  role: string;
  email?: string;
  fullName?: string;
}

@Injectable()
export class CatalogAuthClient {
  constructor(private readonly configService: ConfigService) {}

  async getProductSnapshot(productId: string): Promise<ProductSnapshot> {
    const baseUrl = this.configService.get<string>('PRODUCT_SERVICE_URL') || 'http://localhost:3002';
    const url = `${baseUrl}/products/internal/${productId}/snapshot`;

    const response = await this.safeFetch(url, 'product-service');
    if (response.status === 404) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
    if (!response.ok) {
      throw new BadGatewayException('Unable to validate product data from product-service');
    }

    const result = await response.json();
    return (result.data ? result.data : result) as ProductSnapshot;
  }

  async getUserSummary(userId: string): Promise<UserSummary> {
    const baseUrl = this.configService.get<string>('AUTH_SERVICE_URL') || 'http://localhost:3001';
    const url = `${baseUrl}/internal/users/${userId}`;

    const response = await this.safeFetch(url, 'auth-service');
    if (response.status === 404) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    if (!response.ok) {
      throw new BadGatewayException('Unable to validate user data from auth-service');
    }

    const result = await response.json();
    return (result.data ? result.data : result) as UserSummary;
  }

  private async safeFetch(url: string, serviceName: string): Promise<Response> {
    try {
      return await fetch(url);
    } catch {
      throw new ServiceUnavailableException(`${serviceName} is unavailable`);
    }
  }
}
