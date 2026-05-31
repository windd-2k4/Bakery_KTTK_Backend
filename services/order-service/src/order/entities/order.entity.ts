import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderStatus } from '../enums/order-status.enum';
import { OrderItem } from './order-item.entity';
import { OrderStatusLog } from './order-status-log.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    enumName: 'order_status',
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column('decimal', { name: 'total_amount', precision: 10, scale: 2 })
  totalAmount: number;

  @Column('jsonb', { name: 'shipping_address' })
  shippingAddress: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ name: 'cancelled_reason', type: 'text', nullable: true })
  cancelledReason: string | null;

  @Column({ name: 'cancelled_by', type: 'varchar', length: 50, nullable: true })
  cancelledBy: string | null;

  @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
  confirmedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
  items: OrderItem[];

  @OneToMany(() => OrderStatusLog, (log) => log.order, { eager: false })
  statusLogs: OrderStatusLog[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}