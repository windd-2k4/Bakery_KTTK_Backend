import { Injectable, Logger } from '@nestjs/common';
import { IPaymentStrategy, PaymentStrategyResult } from './payment.strategy';

@Injectable()
export class CodStrategy implements IPaymentStrategy {
  private readonly logger = new Logger(CodStrategy.name);

  async createPayment(
    orderId: string,
    amount: number,
    userId: string,
    description?: string,
  ): Promise<PaymentStrategyResult> {
    this.logger.log(`COD payment created for order ${orderId} with amount ${amount}`);
    const reference = `COD-${orderId}-${Date.now()}`;

    return {
      success: true,
      reference,
      responseMessage: 'COD payment created successfully. Payment will be collected on delivery.',
    };
  }
 
  async verifyPayment(transactionId: string, amount: number): Promise<boolean> {
    try {
      this.logger.debug(`Verifying COD payment: ${transactionId}`);
      return true;
    } catch (error) {
      this.logger.error('COD verification failed', error);
      return false;
    }
  }

  async handleCallback(callbackData: any): Promise<PaymentStrategyResult> {
    try {
      const { reference, status } = callbackData;

      if (status === 'DELIVERED') {
        return {
          success: true,
          reference,
          responseMessage: 'COD payment confirmed on delivery',
        };
      } else {
        return {
          success: false,
          reference,
          responseMessage: 'COD payment pending',
        };
      }
    } catch (error) {
      this.logger.error('COD callback handling failed', error);
      return {
        success: false,
        responseMessage: 'Callback processing failed',
      };
    }
  }

  async refund(transactionId: string, amount: number): Promise<PaymentStrategyResult> {
    try {
      this.logger.log(`Processing COD refund for transaction ${transactionId}`);
      return {
        success: true,
        transactionId,
        responseMessage: 'COD refund request created. Customer will receive refund on delivery.',
      };
    } catch (error) {
      this.logger.error('COD refund failed', error);
      return {
        success: false,
        responseMessage: `COD refund error: ${error.message}`,
      };
    }
  }
}