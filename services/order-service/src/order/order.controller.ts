import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Logger } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { OrderTransitionGuard } from './guards/order-transition.guard';

@Controller('orders')
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(private readonly orderService: OrderService) {}

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto) {
    this.logger.log('Creating new order');
    return this.orderService.create(createOrderDto);
  }

  @Get()
  async findAll(@Req() req: any) {
    const userId = req.query.userId;
    this.logger.log(`Fetching orders${userId ? ` for user ${userId}` : ''}`);
    return this.orderService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log(`Fetching order ${id}`);
    return this.orderService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    this.logger.log(`Updating order ${id}`);
    return this.orderService.update(id, updateOrderDto);
  }

  @Patch(':id/status')
  @UseGuards(OrderTransitionGuard)
  async updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto) {
    this.logger.log(`Updating status for order ${id} to ${updateStatusDto.status}`);
    return this.orderService.updateStatus(id, updateStatusDto);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    this.logger.log(`Cancelling order ${id}`);
    return this.orderService.cancel(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    this.logger.log(`Deleting order ${id}`);
    await this.orderService.remove(id);
    return { message: 'Order deleted successfully' };
  }
}
