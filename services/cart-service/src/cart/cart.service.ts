import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { CartCacheService } from './cart.cache';
import { AddItemDto } from './dto/add-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private cartRepo: Repository<Cart>,
    @InjectRepository(CartItem) private itemRepo: Repository<CartItem>,
    private cacheService: CartCacheService,
  ) {}
 
  // ── ĐỌC GIỎ HÀNG (Redis first) ────────────────────
  async getCart(userId: string): Promise<Cart> {
    const cached = await this.cacheService.get(userId);
    if (cached) return cached;
 
    let cart = await this.cartRepo.findOne({ where: { userId } });
    if (!cart) cart = await this.cartRepo.save({ userId });
 
    await this.cacheService.set(userId, cart);
    return cart;
  }
 
  // ── THÊM SẢN PHẨM ──────────────────────────────────
  async addItem(userId: string, dto: AddItemDto): Promise<Cart> {
    const cart = await this.getCart(userId);
 
    const existing = cart.items.find(i => i.productId === dto.productId);
    if (existing) {
      existing.quantity += dto.quantity;
      await this.itemRepo.save(existing);
    } else {
      await this.itemRepo.save({ ...dto, cart });
    }
 
    await this.cacheService.invalidate(userId); // xoá cache cũ
    return this.getCart(userId);                // đọc lại từ DB → cache mới
  }
 
  // ── XOÁ ITEM ────────────────────────────────────────
  async removeItem(userId: string, itemId: string): Promise<Cart> {
    await this.itemRepo.delete({ id: itemId });
    await this.cacheService.invalidate(userId);
    return this.getCart(userId);
  }
 
  // ── XOÁ TOÀN BỘ (sau khi checkout) ─────────────────
  async clearCart(userId: string): Promise<void> {
    const cart = await this.cartRepo.findOne({ where: { userId } });
    if (cart) await this.itemRepo.delete({ cart: { id: cart.id } });
    await this.cacheService.invalidate(userId);
  }
}