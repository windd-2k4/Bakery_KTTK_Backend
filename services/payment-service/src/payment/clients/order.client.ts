import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface OrderSnapshotResponse {
  id: string;
  userId: string;
  userEmail?: string;
  customerName?: string;
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

    // Fault Tolerance: Retry Mechanism (3s - 5s)
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
          const bodyText = await response.text().catch(() => '');
          this.logger.error(`Failed to fetch order ${orderId} from order-service: ${response.status} ${bodyText}`);
          if (response.status === 404) {
            throw new BadRequestException(`Order ${orderId} not found`);
          }
          throw new Error(`Unable to fetch order ${orderId}`);
        }

        const body = (await response.json()) as { data?: OrderSnapshotResponse & { userEmail?: string; customerName?: string } };
        if (!body?.data?.id) {
          throw new Error(`Order ${orderId} payload is invalid`);
        }

        return body.data;
      } catch (error) {
        attempt++;
        this.logger.warn(`Attempt ${attempt} failed to fetch order ${orderId}. Retrying in 3s...`);
        if (attempt >= maxRetries) {
          throw new BadRequestException(error.message || `Unable to fetch order ${orderId}`);
        }
        // Đợi 3 giây trước khi retry (Fault Tolerance Retry 3-5s)
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    throw new BadRequestException(`Unable to fetch order ${orderId}`);
  }
}
