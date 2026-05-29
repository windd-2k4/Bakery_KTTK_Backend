import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiResponse } from '../common/api-response';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class CartController {
  private readonly logger = new Logger(CartController.name);

  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`Fetching cart for user ${user.userId}`);
    const cart = await this.cartService.getCart(user.userId);
    return ApiResponse.success(cart, 'Cart retrieved successfully');
  }

  @Post('items')
  async addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddItemDto,
  ) {
    this.logger.log(
      `Adding product ${dto.productId} (qty ${dto.quantity}) to cart for user ${user.userId}`,
    );
    const cart = await this.cartService.addItem(user.userId, dto);
    return ApiResponse.success(cart, 'Item added to cart', 201);
  }

  @Patch('items/:itemId')
  async updateItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateItemDto,
  ) {
    this.logger.log(`Updating cart item ${itemId} for user ${user.userId}`);
    const cart = await this.cartService.updateItem(user.userId, itemId, dto);
    return ApiResponse.success(cart, 'Cart item updated successfully');
  }

  @Delete('items/:itemId')
  async removeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    this.logger.log(`Removing cart item ${itemId} for user ${user.userId}`);
    const cart = await this.cartService.removeItem(user.userId, itemId);
    return ApiResponse.success(cart, 'Cart item removed successfully');
  }

  @Delete()
  async clearCart(@CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`Clearing cart for user ${user.userId}`);
    await this.cartService.clearCart(user.userId);
    return ApiResponse.success(null, 'Cart cleared successfully');
  }
}
