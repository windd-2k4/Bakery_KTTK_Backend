import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentMethod, PaymentStatus } from './enums/payment.enum';
import { IPaymentStrategy } from './strategies/payment.strategy';
import { VnpayStrategy } from './strategies/vnpay.strategy';
import { MomoStrategy } from './strategies/momo.strategy';
import { CodStrategy } from './strategies/cod.strategy';
import { ApiResponse } from '../common/api-response';

type LegacyOrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'REFUND_PENDING'
  | 'CANCELLED';

interface LegacyOrderRecord {
  id: string;
  userId: string;
  tongTien: number;
  paymentMethod?: string | null;
  trangThai: LegacyOrderStatus;
  ngayDatHang?: Date | string | null;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly strategies: Map<PaymentMethod, IPaymentStrategy>;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private vnpayStrategy: VnpayStrategy,
    private momoStrategy: MomoStrategy,
    private codStrategy: CodStrategy,
  ) {
    this.strategies = new Map<PaymentMethod, IPaymentStrategy>([
      [PaymentMethod.VNPAY, this.vnpayStrategy],
      [PaymentMethod.MOMO, this.momoStrategy],
      [PaymentMethod.COD, this.codStrategy],
    ]);
  }
    async createPayment(createPaymentDto: CreatePaymentDto): Promise<ApiResponse<Payment>> {
      const strategy = this.getStrategy(createPaymentDto.method);

      const paymentResult = await strategy.createPayment(
        createPaymentDto.orderId,
        createPaymentDto.amount,
        createPaymentDto.userId,
        createPaymentDto.description,
      );

      const payment = this.paymentRepository.create({
        orderId: createPaymentDto.orderId,
        userId: createPaymentDto.userId,
        amount: createPaymentDto.amount,
        method: createPaymentDto.method,
        status: paymentResult.success ? PaymentStatus.PROCESSING : PaymentStatus.FAILED,
        transactionId: paymentResult.transactionId ?? null,
        reference: paymentResult.reference ?? null,
        description: createPaymentDto.description ?? null,
        responseCode: paymentResult.responseCode ?? null,
        responseMessage: paymentResult.responseMessage,
        paymentUrl: paymentResult.paymentUrl ?? null,
      });

      const saved = await this.paymentRepository.save(payment);
      return ApiResponse.success(saved, 'Payment created', 201);
    }

    async findOne(id: string): Promise<ApiResponse<Payment>> {
      const payment = await this.paymentRepository.findOne({ where: { id } });
      if (!payment) {
        throw new NotFoundException(`Payment ${id} not found`);
      }

      return ApiResponse.success(payment);
    }

    async findByOrderId(orderId: string): Promise<ApiResponse<Payment | null>> {
      const payment = await this.paymentRepository.findOne({ where: { orderId } });
      return ApiResponse.success(payment);
    }

    async findAll(): Promise<ApiResponse<Payment[]>> {
      const payments = await this.paymentRepository.find({ order: { createdAt: 'DESC' } });
      return ApiResponse.success(payments);
    }

    async verifyPayment(id: string, transactionId: string): Promise<ApiResponse<Payment>> {
      const payment = await this.findPaymentOrThrow(id);
      const strategy = this.getStrategy(payment.method);
      const verified = await strategy.verifyPayment(transactionId, Number(payment.amount));

      payment.transactionId = transactionId;
      payment.status = verified ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
      payment.responseCode = verified ? '00' : '99';
      payment.responseMessage = verified ? 'Payment verified' : 'Payment verification failed';

      const updated = await this.paymentRepository.save(payment);
      return ApiResponse.success(updated, 'Payment verification updated');
    }

    async refund(id: string): Promise<ApiResponse<Payment>> {
      const payment = await this.findPaymentOrThrow(id);
      const strategy = this.getStrategy(payment.method);
      const refundResult = await strategy.refund(payment.transactionId || payment.reference || payment.id, Number(payment.amount));

      if (!refundResult.success) {
        throw new BadRequestException(refundResult.responseMessage);
      }

      payment.status = PaymentStatus.REFUNDED;
      payment.responseMessage = refundResult.responseMessage;
      const updated = await this.paymentRepository.save(payment);

      return ApiResponse.success(updated, 'Refund processed');
    }

    async handleCallback(method: PaymentMethod, callbackData: any): Promise<Payment> {
      const strategy = this.getStrategy(method);
      const callbackResult = await strategy.handleCallback(callbackData);
      const payment = await this.findPaymentByReferenceOrThrow(callbackData, callbackResult);

      payment.transactionId = callbackResult.transactionId ?? payment.transactionId;
      payment.responseCode = callbackResult.responseCode ?? payment.responseCode;
      payment.responseMessage = callbackResult.responseMessage;
      payment.status = callbackResult.success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;

      return this.paymentRepository.save(payment);
    }

    async migrateLegacyOrdersToCompletedPayments(
      legacyOrders: LegacyOrderRecord[],
    ): Promise<ApiResponse<Array<{ orderId: string; paymentId: string; orderStatus: 'COMPLETED'; paymentStatus: PaymentStatus }>>> {
      const migrated: Array<{ orderId: string; paymentId: string; orderStatus: 'COMPLETED'; paymentStatus: PaymentStatus }> = [];

      for (const legacyOrder of legacyOrders) {
        const existing = await this.paymentRepository.findOne({ where: { orderId: legacyOrder.id } });
        const method = this.mapLegacyPaymentMethod(legacyOrder.paymentMethod);

        if (existing) {
          existing.method = method;
          existing.status = PaymentStatus.SUCCESS;
          existing.amount = legacyOrder.tongTien;
          existing.responseMessage = 'Migrated from legacy orders';
          existing.reference = existing.reference || `legacy-${legacyOrder.id}`;

          const updated = await this.paymentRepository.save(existing);
          migrated.push({
            orderId: legacyOrder.id,
            paymentId: updated.id,
            orderStatus: 'COMPLETED',
            paymentStatus: updated.status,
          });
          continue;
        }

        const created = this.paymentRepository.create({
          orderId: legacyOrder.id,
          userId: legacyOrder.userId,
          amount: legacyOrder.tongTien,
          method,
          status: PaymentStatus.SUCCESS,
          transactionId: null,
          reference: `legacy-${legacyOrder.id}`,
          description: 'Migrated from legacy orders table',
          responseCode: this.mapLegacyOrderStatusCode(legacyOrder.trangThai),
          responseMessage: 'Legacy order migrated to completed payment',
        });

        const saved = await this.paymentRepository.save(created);
        migrated.push({
          orderId: legacyOrder.id,
          paymentId: saved.id,
          orderStatus: 'COMPLETED',
          paymentStatus: saved.status,
        });
      }

      return ApiResponse.success(migrated, 'Legacy orders migrated to completed payments');
    }

    private getStrategy(method: PaymentMethod): IPaymentStrategy {
      const strategy = this.strategies.get(method);
      if (!strategy) {
        throw new BadRequestException(`Payment method ${method} is not supported`);
      }

      return strategy;
    }

    private async findPaymentOrThrow(id: string): Promise<Payment> {
      const payment = await this.paymentRepository.findOne({ where: { id } });
      if (!payment) {
        throw new NotFoundException(`Payment ${id} not found`);
      }

      return payment;
    }

    private async findPaymentByReferenceOrThrow(callbackData: any, callbackResult: { reference?: string }): Promise<Payment> {
      const rawReference =
        callbackResult.reference ||
        callbackData?.reference ||
        callbackData?.vnp_TxnRef ||
        callbackData?.orderId ||
        callbackData?.order_id;

      if (!rawReference) {
        throw new BadRequestException('Cannot resolve payment reference from callback');
      }

      const orderId = typeof rawReference === 'string' && rawReference.includes('-')
        ? rawReference.split('-')[0]
        : rawReference;

      const payment = await this.paymentRepository.findOne({
        where: [
          { reference: rawReference },
          { orderId },
        ],
        order: { createdAt: 'DESC' },
      });

      if (!payment) {
        throw new NotFoundException(`Payment for reference ${rawReference} not found`);
      }

      return payment;
    }

    private mapLegacyPaymentMethod(method?: string | null): PaymentMethod {
      const normalized = (method || '').toUpperCase();
      if (normalized.includes('VNPAY')) {
        return PaymentMethod.VNPAY;
      }
      if (normalized.includes('MOMO')) {
        return PaymentMethod.MOMO;
      }
      return PaymentMethod.COD;
    }

    private mapLegacyOrderStatusCode(status: LegacyOrderStatus): string {
      if (status === 'PAID' || status === 'COMPLETED' || status === 'CONFIRMED') {
        return '00';
      }
      if (status === 'CANCELLED') {
        return '24';
      }
      return '10';
    }
      }