// src/order/entities/order-item.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { Order } from './order.entity';
@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Order, (o) => o.items, { onDelete: 'CASCADE' }) order: Order;
  @Column() productId: string;
  @Column() productName: string;   // snapshot lúc đặt
  @Column('decimal', { precision: 10, scale: 2 }) productPrice: number;
  @Column() quantity: number;
  @Column('decimal', { precision: 10, scale: 2 }) subtotal: number;
  @CreateDateColumn() createdAt: Date;
}
 