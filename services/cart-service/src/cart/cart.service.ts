import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { CartCacheService } from './cart.cache';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CartResponse } from './interfaces/cart-response.interface';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem) private readonly itemRepo: Repository<CartItem>,
    private readonly cacheService: CartCacheService,
  ) {}

  async getCart(userId: string): Promise<CartResponse> {
    const cached = await this.cacheService.get(userId);
    if (cached) {
      return this.toResponse(cached);
    }

    const cart = await this.loadCartFromDb(userId);
    await this.cacheService.set(userId, cart);
    return this.toResponse(cart);
  }

  async addItem(userId: string, dto: AddItemDto): Promise<CartResponse> {
    const cart = await this.loadCartFromDb(userId);
    const items = cart.items ?? [];

    const existing = items.find((i) => i.productId === dto.productId);
    if (existing) {
      existing.quantity += dto.quantity;
      await this.itemRepo.save(existing);
    } else {
      await this.itemRepo.save(
        this.itemRepo.create({
          cart: { id: cart.id } as Cart,
          productId: dto.productId,
          quantity: dto.quantity,
        }),
      );
    }

    await this.cacheService.invalidate(userId);
    return this.getCart(userId);
  }

  async updateItem(
    userId: string,
    itemId: string,
    dto: UpdateItemDto,
  ): Promise<CartResponse> {
    const item = await this.findOwnedItem(userId, itemId);
    item.quantity = dto.quantity;
    await this.itemRepo.save(item);

    await this.cacheService.invalidate(userId);
    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<CartResponse> {
    await this.findOwnedItem(userId, itemId);
    await this.itemRepo.delete({ id: itemId });

    await this.cacheService.invalidate(userId);
    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items'],
    });

    if (cart?.items?.length) {
      await this.itemRepo.delete({ cart: { id: cart.id } });
    }

    await this.cacheService.invalidate(userId);
  }

  toResponse(cart: Cart): CartResponse {
    const items = cart.items ?? [];
    return {
      id: cart.id,
      userId: cart.userId,
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        addedAt: item.addedAt,
      })),
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  private async loadCartFromDb(userId: string): Promise<Cart> {
    let cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items'],
    });

    if (!cart) {
      cart = await this.cartRepo.save(this.cartRepo.create({ userId }));
      cart.items = [];
    }

    return cart;
  }

  private async findOwnedItem(userId: string, itemId: string): Promise<CartItem> {
    const item = await this.itemRepo.findOne({
      where: { id: itemId },
      relations: ['cart'],
    });

    if (!item) {
      throw new NotFoundException(`Cart item ${itemId} not found`);
    }

    if (item.cart.userId !== userId) {
      throw new ForbiddenException('You do not have access to this cart item');
    }

    return item;
  }
}
