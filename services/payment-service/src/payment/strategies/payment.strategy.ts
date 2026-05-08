export interface PaymentStrategyResult {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  responseCode?: string;
  responseMessage: string;
  reference?: string;
}

export interface IPaymentStrategy {
  createPayment(orderId: string, amount: number, userId: string, description?: string): Promise<PaymentStrategyResult>;
  verifyPayment(transactionId: string, amount: number): Promise<boolean>;
  handleCallback(callbackData: any): Promise<PaymentStrategyResult>;
  refund(transactionId: string, amount: number): Promise<PaymentStrategyResult>;
}