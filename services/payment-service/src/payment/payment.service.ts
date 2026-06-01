import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac } from 'crypto';
import { Repository } from 'typeorm';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment } from './entities/payment.entity';
import { PaymentMethod, PaymentStatus } from './enums/payment.enum';
import { PaymentPublisher } from './publishers/payment.publisher';
import { SepayStrategy } from './strategies/sepay.strategy';
import { StripeStrategy } from './strategies/stripe.strategy';
import { VnpayStrategy } from './strategies/vnpay.strategy';
import { OrderClient } from './clients/order.client';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly stripeStrategy: StripeStrategy,
    private readonly sepayStrategy: SepayStrategy,
    private readonly vnpayStrategy: VnpayStrategy,
    private readonly paymentPublisher: PaymentPublisher,
    private readonly orderClient: OrderClient,
  ) {}

  async createSession(dto: CreatePaymentDto) {
    const order = await this.orderClient.getOrderById(dto.orderId);
    if (!order) {
      throw new NotFoundException(`Order ${dto.orderId} not found`);
    }

    if (order.paymentMethod?.toUpperCase?.() && order.paymentMethod.toUpperCase() !== dto.method) {
      throw new BadRequestException(`Payment method mismatch. Order requires ${order.paymentMethod}`);
    }

    const strategy = this.resolveStrategy(dto.method);
    const amount = Number(order.totalAmount);
    const description = `Payment for order ${order.id}`;
    const result = await strategy.createPayment(order.id, amount, description);

    const payment = this.paymentRepository.create({
      orderId: order.id,
      userId: order.userId,
      amount,
      method: dto.method,
      status: PaymentStatus.PENDING,
      providerReference: result.reference ?? null,
      paymentContent: result.qrPayload ? String(result.qrPayload['transferContent'] ?? '') : null,
      paymentUrl: result.sessionUrl ?? result.paymentUrl ?? null,
      qrPayload: result.qrPayload ?? null,
      providerData: result.providerData ?? null,
    });

    const saved = await this.paymentRepository.save(payment);

    return {
      success: true,
      data: {
        paymentId: saved.id,
        orderId: saved.orderId,
        method: saved.method,
        amount: saved.amount,
        status: saved.status,
        sessionUrl: result.sessionUrl ?? null,
        paymentUrl: result.paymentUrl ?? result.sessionUrl ?? null,
        qrPayload: result.qrPayload ?? null,
        providerData: result.providerData ?? null,
      },
    };
  }

  async handleStripeWebhook(payload: Record<string, unknown>) {
    try {
      const eventType = typeof payload?.['type'] === 'string' ? String(payload['type']) : '';
      if (eventType !== 'checkout.session.completed') {
        return { success: true, skipped: true };
      }

      const session = (payload?.['data'] as { object?: Record<string, unknown> } | undefined)?.object ?? {};
      const metadata = (session?.['metadata'] as Record<string, unknown> | undefined) ?? {};
      const orderId = typeof metadata['orderId'] === 'string' ? String(metadata['orderId']) : '';
      if (!orderId) {
        throw new BadRequestException('Stripe webhook missing metadata.orderId');
      }

      const payment = await this.findPaymentByOrderId(orderId);
      payment.status = PaymentStatus.SUCCESS;
      payment.providerReference = typeof session['id'] === 'string' ? String(session['id']) : payment.providerReference ?? null;
      payment.providerData = payload;
      payment.paidAt = new Date();

      const saved = await this.paymentRepository.save(payment);
      await this.paymentPublisher.publishPaymentCompleted(this.toCompletedEvent(saved));

      return { success: true, data: saved };
    } catch (error) {
      this.logger.error('Stripe webhook processing failed', error instanceof Error ? error.stack : String(error));
      return { success: false, message: error instanceof Error ? error.message : 'Stripe webhook failed' };
    }
  }

  async handleSepayWebhook(payload: Record<string, unknown>) {
    try {
      const transferContent = this.extractTransferContent(payload);
      const matchedOrderId = this.extractOrderIdFromContent(transferContent);
      if (!matchedOrderId) {
        return { success: true, skipped: true };
      }

      const payment = await this.findPaymentByOrderId(matchedOrderId);
      const receivedAmount = this.extractAmount(payload);
      const expectedAmount = Number(payment.amount);
      if (!Number.isNaN(receivedAmount) && receivedAmount !== expectedAmount) {
        return { success: true, skipped: true, reason: 'amount_mismatch' };
      }

      payment.status = PaymentStatus.SUCCESS;
      payment.providerReference = this.extractTransactionId(payload) ?? payment.providerReference ?? null;
      payment.providerData = payload;
      payment.paidAt = new Date();

      const saved = await this.paymentRepository.save(payment);
      await this.paymentPublisher.publishPaymentCompleted(this.toCompletedEvent(saved));

      return { success: true, data: saved };
    } catch (error) {
      this.logger.error('SePay webhook processing failed', error instanceof Error ? error.stack : String(error));
      return { success: false, message: error instanceof Error ? error.message : 'SePay webhook failed' };
    }
  }

  async handleVnpayCallback(query: Record<string, unknown>) {
    try {
      const secretKey = process.env.VNPAY_SECRET_KEY ?? 'DEMO_SECRET';
      const checksumValid = this.validateVnpayChecksum(query, secretKey);
      if (!checksumValid) {
        throw new BadRequestException('Invalid VNPAY checksum');
      }

      const responseCode = typeof query['vnp_ResponseCode'] === 'string' ? String(query['vnp_ResponseCode']) : '';
      if (responseCode !== '00') {
        return { success: true, skipped: true, responseCode };
      }

      const orderRef = typeof query['vnp_TxnRef'] === 'string' ? String(query['vnp_TxnRef']) : '';
      const orderId = this.extractOrderIdFromTxnRef(orderRef);
      if (!orderId) {
        throw new BadRequestException('Cannot resolve orderId from VNPAY transaction reference');
      }

      const payment = await this.findPaymentByOrderId(orderId);
      payment.status = PaymentStatus.SUCCESS;
      payment.providerReference = typeof query['vnp_TransactionNo'] === 'string' ? String(query['vnp_TransactionNo']) : payment.providerReference ?? null;
      payment.providerData = query;
      payment.paidAt = new Date();

      const saved = await this.paymentRepository.save(payment);
      await this.paymentPublisher.publishPaymentCompleted(this.toCompletedEvent(saved));

      return { success: true, data: saved };
    } catch (error) {
      this.logger.error('VNPAY callback processing failed', error instanceof Error ? error.stack : String(error));
      return { success: false, message: error instanceof Error ? error.message : 'VNPAY callback failed' };
    }
  }

  async findAll() {
    return this.paymentRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found`);
    }

    return payment;
  }

  private resolveStrategy(method: PaymentMethod) {
    switch (method) {
      case PaymentMethod.STRIPE:
        return this.stripeStrategy;
      case PaymentMethod.SEPAY:
        return this.sepayStrategy;
      case PaymentMethod.VNPAY:
        return this.vnpayStrategy;
      default:
        throw new BadRequestException(`Unsupported payment method ${method}`);
    }
  }

  private async findPaymentByOrderId(orderId: string) {
    const payment = await this.paymentRepository.findOne({ where: { orderId } });
    if (!payment) {
      throw new NotFoundException(`Payment for order ${orderId} not found`);
    }

    return payment;
  }

  private toCompletedEvent(payment: Payment) {
    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      method: payment.method,
      amount: Number(payment.amount),
      providerReference: payment.providerReference ?? null,
      paidAt: payment.paidAt ?? new Date(),
    };
  }

  private extractTransferContent(payload: Record<string, unknown>): string {
    const contentCandidates = [
      payload['content'],
      payload['description'],
      payload['transferContent'],
      (payload['data'] as Record<string, unknown> | undefined)?.['content'],
      (payload['data'] as Record<string, unknown> | undefined)?.['description'],
    ];

    for (const candidate of contentCandidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }

    return '';
  }

  private extractOrderIdFromContent(content: string): string | null {
    const match = content.match(/SB([A-Za-z0-9-]+)/i);
    return match?.[1] ?? null;
  }

  private extractAmount(payload: Record<string, unknown>): number {
    const candidates = [payload['amount'], payload['creditAmount'], payload['transactionAmount']];
    for (const candidate of candidates) {
      const value = Number(candidate);
      if (!Number.isNaN(value) && value > 0) {
        return value;
      }
    }

    return NaN;
  }

  private extractTransactionId(payload: Record<string, unknown>): string | null {
    const candidates = [payload['transactionId'], payload['id'], payload['bankTransactionId']];
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }

    return null;
  }

  private extractOrderIdFromTxnRef(txnRef: string): string | null {
    const match = txnRef.match(/(?:VNPAY-)?(.+)-\d+$/i);
    return match?.[1] ?? null;
  }

  private validateVnpayChecksum(query: Record<string, unknown>, secretKey: string): boolean {
    try {
      const secureHash = typeof query['vnp_SecureHash'] === 'string' ? String(query['vnp_SecureHash']) : '';
      if (!secureHash) {
        return false;
      }

      const filteredEntries = Object.entries(query)
        .filter(([key]) => key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType')
        .sort(([a], [b]) => a.localeCompare(b));

      const signData = new URLSearchParams(filteredEntries.reduce<Record<string, string>>((acc, [key, value]) => {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          acc[key] = String(value);
        }
        return acc;
      }, {})).toString();

      const computed = createHmac('sha512', secretKey).update(Buffer.from(signData, 'utf-8')).digest('hex');
      return computed.toLowerCase() === secureHash.toLowerCase();
    } catch (error) {
      this.logger.error('Checksum validation failed', error instanceof Error ? error.stack : String(error));
      return false;
    }
  }
}
