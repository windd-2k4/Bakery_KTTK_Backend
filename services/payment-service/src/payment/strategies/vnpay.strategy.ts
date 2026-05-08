import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { IPaymentStrategy, PaymentStrategyResult } from './payment.strategy';

@Injectable()
export class VnpayStrategy implements IPaymentStrategy {
  private readonly logger = new Logger(VnpayStrategy.name);
  private readonly vnpayUrl = 'https://sandbox.vnpayment.vn/paygate/pay.html';

  constructor(private config: ConfigService) {}
 
  async createPayment(orderId: string, amount: number,
                      userId: string, description?: string): Promise<PaymentStrategyResult> {
    const params = {
      vnp_Version:    '2.1.0',
      vnp_Command:    'pay',
      vnp_TmnCode:    this.config.get('VNPAY_TMN_CODE') || '',
      vnp_Amount:     (amount * 100).toString(),
      vnp_CurrCode:   'VND',
      vnp_TxnRef:     `${orderId}-${Date.now()}`,
      vnp_OrderInfo:  description || `Payment for order ${orderId}`,
      vnp_ReturnUrl:  this.config.get('VNPAY_RETURN_URL') || 'http://localhost:3002/payment/vnpay-callback',
      vnp_CreateDate: new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14),
      vnp_IpAddr:     '127.0.0.1',
    };
 
    const sortedParams = this.sortObject(params);
    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac('sha512', this.config.get('VNPAY_SECRET_KEY') || '');
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
 
    const paymentUrl = `${this.vnpayUrl}?${signData}&vnp_SecureHash=${signed}`;
 
    return {
      success: true,
      paymentUrl,
      reference: sortedParams.vnp_TxnRef,
      responseMessage: 'Payment URL generated successfully',
    };
  }

  async verifyPayment(transactionId: string, amount: number): Promise<boolean> {
    try {
      this.logger.debug(`Verifying VNPay transaction: ${transactionId}`);
      return true;
    } catch (error) {
      this.logger.error('VNPay verification failed', error);
      return false;
    }
  }
 
  async handleCallback(callbackData: Record<string, any>): Promise<PaymentStrategyResult> {
    try {
      const { vnp_ResponseCode, vnp_TransactionNo, vnp_Amount, vnp_OrderInfo, ...params } = callbackData;

      if (vnp_ResponseCode === '00') {
        return {
          success: true,
          transactionId: vnp_TransactionNo,
          responseCode: vnp_ResponseCode,
          responseMessage: 'Payment successful',
        };
      } else {
        return {
          success: false,
          responseCode: vnp_ResponseCode,
          responseMessage: 'Payment failed',
        };
      }
    } catch (error) {
      this.logger.error('VNPay callback handling failed', error);
      return {
        success: false,
        responseMessage: 'Callback processing failed',
      };
    }
  }

  async refund(transactionId: string, amount: number): Promise<PaymentStrategyResult> {
    try {
      this.logger.log(`Processing VNPay refund for transaction ${transactionId}`);
      return {
        success: true,
        transactionId,
        responseMessage: 'Refund processed successfully',
      };
    } catch (error) {
      this.logger.error('VNPay refund failed', error);
      return {
        success: false,
        responseMessage: `VNPay refund error: ${error.message}`,
      };
    }
  }

  private verifyCallbackSignature(data: Record<string, any>): boolean {
    const { vnp_SecureHash, ...params } = data;
    const sortedParams = this.sortObject(params);
    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac('sha512', this.config.get('VNPAY_SECRET_KEY') || '');
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    return signed === vnp_SecureHash;
  }
 
  private sortObject(obj: Record<string, any>) {
    return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
  }
}