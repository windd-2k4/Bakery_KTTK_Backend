export interface PaymentStrategyResult {
  success: boolean;
  sessionUrl?: string;
  paymentUrl?: string;
  reference?: string;
  transactionId?: string;
  responseCode?: string;
  responseMessage?: string;
  qrPayload?: Record<string, unknown>;
  providerData?: Record<string, unknown>;
}

export interface IPaymentStrategy {
  createPayment(orderId: string, amount: number, description?: string): Promise<PaymentStrategyResult>;
  handleWebhook(payload: Record<string, unknown>): Promise<PaymentStrategyResult>;
}
