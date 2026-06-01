import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface OrderSnapshotResponse {
  id: string;
  userId: string;
  totalAmount: number;
  paymentMethod: string;
  status?: string;
}

@Injectable()
export class OrderClient {
  private readonly logger = new Logger(OrderClient.name);

  constructor(private readonly configService: ConfigService) {}

  async getOrderById(orderId: string): Promise<OrderSnapshotResponse> {
    const baseUrl = this.configService.get<string>('ORDER_SERVICE_URL') ?? 'http://localhost:3003';
    const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
    const url = `${normalizedBaseUrl}/orders/${orderId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      this.logger.error(`Failed to fetch order ${orderId} from order-service: ${response.status} ${bodyText}`);
      if (response.status === 404) {
        throw new BadRequestException(`Order ${orderId} not found`);
      }
      throw new BadRequestException(`Unable to fetch order ${orderId}`);
    }

    const body = (await response.json()) as { data?: OrderSnapshotResponse };
    if (!body?.data?.id) {
      throw new BadRequestException(`Order ${orderId} payload is invalid`);
    }

    return body.data;
  }
}
