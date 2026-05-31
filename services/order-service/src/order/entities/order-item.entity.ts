import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid') id: string;

  @ManyToOne(() => Order, (o) => o.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ name: 'product_name', type: 'varchar', length: 255 })
  productName: string;

  @Column('decimal', { name: 'product_price', precision: 10, scale: 2 })
  productPrice: number;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;
}
 