import { Entity, Unique, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { Cart } from './cart.entity';

@Entity('cart_items')
@Unique(['cart', 'productId'])   // 1 product chỉ xuất hiện 1 lần trong cart
export class CartItem {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  cart: Cart;
  @Column() productId: string;
  @Column() productName: string;   // snapshot
  @Column('decimal', { precision: 10, scale: 2 }) price: number;  // snapshot
  @Column({ default: 1 }) quantity: number;
  @Column({ nullable: true }) imageUrl: string;
  @CreateDateColumn() addedAt: Date;
}