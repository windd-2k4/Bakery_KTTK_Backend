import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentMethod } from './enums/payment.enum';
import { PaymentService } from './payment.service';

@Controller('api')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-session')
  async createSession(@Body() dto: CreatePaymentDto) {
    return this.paymentService.createSession(dto);
  }

  @Post('webhooks/stripe')
  async handleStripeWebhook(@Body() payload: Record<string, unknown>) {
    return this.paymentService.handleStripeWebhook(payload);
  }

  @Post('webhooks/sepay')
  async handleSepayWebhook(@Body() payload: Record<string, unknown>) {
    return this.paymentService.handleSepayWebhook(payload);
  }

  @Get('callback/vnpay')
  async handleVnpayCallback(@Query() query: Record<string, unknown>, @Req() req: Request) {
    const fullQuery = { ...query };
    if (req.query && typeof req.query === 'object') {
      Object.assign(fullQuery, req.query as Record<string, unknown>);
    }
    return this.paymentService.handleVnpayCallback(fullQuery);
  }

  @Post('webhooks/:method')
  async handleWebhook(@Param('method') method: PaymentMethod, @Body() payload: Record<string, unknown>) {
    if (method === PaymentMethod.STRIPE) {
      return this.paymentService.handleStripeWebhook(payload);
    }

    if (method === PaymentMethod.SEPAY) {
      return this.paymentService.handleSepayWebhook(payload);
    }

    if (method === PaymentMethod.VNPAY) {
      return this.paymentService.handleVnpayCallback(payload);
    }

    return { success: false, message: 'Unsupported webhook method' };
  }

  @Get()
  async findAll() {
    return this.paymentService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }
}
