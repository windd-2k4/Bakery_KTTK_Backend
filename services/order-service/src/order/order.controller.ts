import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Logger,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { ApiResponse } from '../common/api-response';
import { Order } from './entities/order.entity';

@Controller('orders')
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(private readonly orderService: OrderService) {}

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto): Promise<ApiResponse<Order>> {
    this.logger.log('Creating new order');
    const createdOrder = await this.orderService.create(createOrderDto);
    return ApiResponse.success(createdOrder, 'Order created', 201);
  }

  @Get()
  async findAll(@Query() query: QueryOrdersDto): Promise<ApiResponse<Order[]>> {
    const userId = query.userId;
    this.logger.log(`Fetching orders${userId ? ` for user ${userId}` : ''}`);
    const orders = await this.orderService.findAll(userId);
    return ApiResponse.success(orders);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse<Order & { userEmail?: string; customerName?: string }>> {
    this.logger.log(`Fetching order ${id}`);
    const order = await this.orderService.findOne(id);
    return ApiResponse.success(order);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<ApiResponse<Order>> {
    this.logger.log(`Updating order ${id}`);
    const updatedOrder = await this.orderService.update(id, updateOrderDto);
    return ApiResponse.success(updatedOrder, 'Order updated');
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ): Promise<ApiResponse<Order>> {
    this.logger.log(`Updating status for order ${id} to ${updateStatusDto.status}`);
    const updatedOrder = await this.orderService.updateStatus(id, updateStatusDto);
    return ApiResponse.success(updatedOrder, 'Order status updated');
  }

  @Post(':id/cancel')
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ): Promise<ApiResponse<Order>> {
    this.logger.log(`Cancelling order ${id}`);
    const cancelledOrder = await this.orderService.cancel(id, 'CUSTOMER', reason);
    return ApiResponse.success(cancelledOrder, 'Order cancelled');
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    this.logger.log(`Deleting order ${id}`);
    await this.orderService.remove(id);
    return ApiResponse.success({ deleted: true }, 'Order deleted successfully');
  }

  @EventPattern('stock.reserved')
  async handleStockReserved(@Payload() payload: { orderId: string }) {
    this.logger.log(`Received stock.reserved event for order ${payload.orderId}`);
    await this.orderService.handleStockReserved(payload);
  }

  @EventPattern('stock.reservation.failed')
  async handleStockReservationFailed(@Payload() payload: { orderId: string, reason?: string }) {
    this.logger.log(`Received stock.reservation.failed event for order ${payload.orderId}`);
    await this.orderService.handleStockReservationFailed(payload);
  }

  @EventPattern('bakery.payment.completed')
  async handlePaymentCompleted(@Payload() message: { eventName: string, payload: { orderId: string, transactionId?: string } }) {
    this.logger.log(`Received bakery.payment.completed event for order ${message?.payload?.orderId}`);
    if (message?.payload) {
      await this.orderService.handlePaymentCompleted(message.payload);
    }
  }
}
