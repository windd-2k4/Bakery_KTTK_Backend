import {
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { InternalApiGuard } from './guards/internal-api.guard';
import { ApiResponse } from '../common/api-response';

@Controller('internal/carts')
@UseGuards(InternalApiGuard)
export class CartInternalController {
  private readonly logger = new Logger(CartInternalController.name);

  constructor(private readonly cartService: CartService) {}

  @Get(':userId')
  async getCartByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
    this.logger.log(`Internal request: get cart for user ${userId}`);
    const cart = await this.cartService.getCart(userId);
    return ApiResponse.success(cart, 'Cart retrieved successfully');
  }

  @Delete(':userId')
  async clearCartByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
    this.logger.log(`Internal request: clear cart for user ${userId}`);
    await this.cartService.clearCart(userId, 'checkout');
    return ApiResponse.success(null, 'Cart cleared successfully');
  }
}
