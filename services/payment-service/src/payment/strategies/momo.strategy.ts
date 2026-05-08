import { Injectable, Logger } from '@nestjs/common';
import { IPaymentStrategy, PaymentStrategyResult } from './payment.strategy';

@Injectable()
export class MomoStrategy implements IPaymentStrategy {
  private readonly logger = new Logger(MomoStrategy.name);
  private readonly partnerId = process.env.MOMO_PARTNER_ID;
  private readonly secretKey = process.env.MOMO_SECRET_KEY;
  private readonly accessKey = process.env.MOMO_ACCESS_KEY;
  private readonly momoUrl = process.env.MOMO_URL || 'https://test-payment.momo.vn/gw_payment/transactionProcessor';

  async createPayment(
    orderId: string,
    amount: number,
    userId: string,
    description?: string,
  ): Promise<PaymentStrategyResult> {
    try {
      const requestId = `${orderId}-${Date.now()}`;
      const notifyurl = process.env.MOMO_NOTIFY_URL || 'http://localhost:3002/payment/momo-callback';
      const returnUrl = process.env.MOMO_RETURN_URL || 'http://localhost:3002/payment/momo-return';

      // In a real implementation, you would call MoMo API
      const paymentUrl = `${this.momoUrl}?requestId=${requestId}&amount=${amount}`;

      return {
        success: true,
        paymentUrl,
        reference: requestId,
        responseMessage: 'MoMo payment URL generated successfully',
      };
    } catch (error) {
      this.logger.error('MoMo payment creation failed', error);
      return {
        success: false,
        responseMessage: `MoMo error: ${error.message}`,
      };
    }
  }

  async verifyPayment(transactionId: string, amount: number): Promise<boolean> {
    try {
      this.logger.debug(`Verifying MoMo transaction: ${transactionId}`);
      // Implementation would call MoMo verification API
      return true;
    } catch (error) {
      this.logger.error('MoMo verification failed', error);
      return false;
    }
  }

  async handleCallback(callbackData: any): Promise<PaymentStrategyResult> {
    try {
      const { resultCode, transId, message } = callbackData;

      if (resultCode === 0) {
        return {
          success: true,
          transactionId: transId,
          responseCode: resultCode.toString(),
          responseMessage: 'Payment successful',
        };
      } else {
        return {
          success: false,
          responseCode: resultCode.toString(),
          responseMessage: message || 'Payment failed',
        };
      }
    } catch (error) {
      this.logger.error('MoMo callback handling failed', error);
      return {
        success: false,
        responseMessage: 'Callback processing failed',
      };
    }
  }

  async refund(transactionId: string, amount: number): Promise<PaymentStrategyResult> {
    try {
      this.logger.log(`Processing MoMo refund for transaction ${transactionId}`);
      // Implementation would call MoMo refund API
      return {
        success: true,
        transactionId,
        responseMessage: 'Refund processed successfully',
      };
    } catch (error) {
      this.logger.error('MoMo refund failed', error);
      return {
        success: false,
        responseMessage: `MoMo refund error: ${error.message}`,
      };
    }
  }
}
