import { Controller, Post, Get, Body, Param, Query, Logger, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentMethod } from './enums/payment.enum';

interface LegacyOrderMigrationDto {
  orders: Array<{
    id: string;
    userId: string;
    tongTien: number;
    paymentMethod?: string | null;
    trangThai: 'PENDING' | 'PAID' | 'CONFIRMED' | 'COMPLETED' | 'REFUND_PENDING' | 'CANCELLED';
    ngayDatHang?: Date | string | null;
  }>;
}

@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    this.logger.log(`Creating payment for order ${createPaymentDto.orderId} via ${createPaymentDto.method}`);
    return this.paymentService.createPayment(createPaymentDto);
  }

  @Get('order/:orderId')
  async findByOrderId(@Param('orderId') orderId: string) {
    this.logger.log(`Fetching payment for order ${orderId}`);
    return this.paymentService.findByOrderId(orderId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log(`Fetching payment ${id}`);
    return this.paymentService.findOne(id);
  }

  @Get()
  async findAll() {
    this.logger.log('Fetching all payments');
    return this.paymentService.findAll();
  }

  @Post(':id/verify')
  async verify(@Param('id') id: string, @Body() body: { transactionId: string }) {
    this.logger.log(`Verifying payment ${id}`);
    return this.paymentService.verifyPayment(id, body.transactionId);
  }

  @Post(':id/refund')
  async refund(@Param('id') id: string) {
    this.logger.log(`Processing refund for payment ${id}`);
    return this.paymentService.refund(id);
  }

  @Get('vnpay/callback')
  async vnpayCallback(@Query() query: any, @Res() res: Response) {
    this.logger.log('VNPay callback received');
    try {
      const payment = await this.paymentService.handleCallback(PaymentMethod.VNPAY, query);
      res.redirect(`http://localhost:3000/payment-result?status=${payment.status}&paymentId=${payment.id}`);
    } catch (error) {
      this.logger.error('VNPay callback error', error);
      res.redirect(`http://localhost:3000/payment-result?status=FAILED&error=${error.message}`);
    }
  }

  @Post('momo/callback')
  async momoCallback(@Body() body: any) {
    this.logger.log('MoMo callback received');
    return this.paymentService.handleCallback(PaymentMethod.MOMO, body);
  }

  @Post('momo/return')
  async momoReturn(@Body() body: any) {
    this.logger.log('MoMo return received');
    return this.paymentService.handleCallback(PaymentMethod.MOMO, body);
  }

  @Post('cod/confirm/:id')
  async codConfirm(@Param('id') id: string, @Body() body: { status: string }) {
    this.logger.log(`COD confirmation for payment ${id}`);
    return this.paymentService.handleCallback(PaymentMethod.COD, { reference: id, status: body.status });
  }

  @Post('migrations/legacy-orders')
  async migrateLegacyOrders(@Body() dto: LegacyOrderMigrationDto) {
    this.logger.log(`Migrating ${dto.orders.length} legacy orders to payments`);
    return this.paymentService.migrateLegacyOrdersToCompletedPayments(dto.orders);
  }
}
