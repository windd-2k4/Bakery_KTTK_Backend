import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Cart } from './entities/cart.entity';

@Injectable()
export class CartCacheService {
  private readonly TTL = 86400; // 24 giờ
 
  constructor(@InjectRedis() private readonly redis: Redis) {}
 
  private key(userId: string) { return `cart:${userId}`; }
 
  async get(userId: string): Promise<Cart | null> {
    const cached = await this.redis.get(this.key(userId));
    return cached ? JSON.parse(cached) : null;
  }
 
  async set(userId: string, cart: Cart): Promise<void> {
    await this.redis.setex(this.key(userId), this.TTL, JSON.stringify(cart));
  }
 
  async invalidate(userId: string): Promise<void> {
    await this.redis.del(this.key(userId));
  }
}