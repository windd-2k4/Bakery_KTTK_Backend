import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface ProductInfo {
  id: string;
  name: string;
  price: number;
  stock: number;
  isAvailable: boolean;
}

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

@Injectable()
export class ProductClient {
  private readonly logger = new Logger(ProductClient.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService,
  ) {
    this.baseUrl =
      configService.get<string>('PRODUCT_SERVICE_URL') ||
      'http://127.0.0.1:3002';
  }

  async getProduct(productId: string): Promise<ProductInfo> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<ApiResponse<ProductInfo>>(
          `${this.baseUrl}/products/${productId}`,
          { timeout: 5000 },
        ),
      );

      const product = response.data?.data;
      if (!product) {
        throw new NotFoundException(`Product ${productId} not found`);
      }

      return product;
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 404) {
        throw new NotFoundException(`Product ${productId} not found`);
      }

      this.logger.error(
        `Product service unavailable for product ${productId}`,
        error instanceof Error ? error.message : error,
      );
      throw new ServiceUnavailableException(
        'Product service is temporarily unavailable',
      );
    }
  }

  async assertCanAdd(
    productId: string,
    quantity: number,
    existingQuantity = 0,
  ): Promise<ProductInfo> {
    const product = await this.getProduct(productId);

    if (!product.isAvailable) {
      throw new BadRequestException(`Product "${product.name}" is not available`);
    }

    const totalQuantity = existingQuantity + quantity;
    if (product.stock < totalQuantity) {
      throw new BadRequestException(
        `Insufficient stock for "${product.name}" (available: ${product.stock})`,
      );
    }

    return product;
  }
}
