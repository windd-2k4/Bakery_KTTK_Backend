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
import { PaymentMethod } from '../enums/payment-method.enum';

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

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    enumName: 'payment_method',
    default: PaymentMethod.CASH,
  })
  paymentMethod: PaymentMethod;

  @Column({ name: 'bank_account_name', type: 'varchar', length: 150, nullable: true })
  bankAccountName: string | null;

  @Column({ name: 'bank_account_number', type: 'varchar', length: 64, nullable: true })
  bankAccountNumber: string | null;

  @Column({ name: 'bank_name', type: 'varchar', length: 120, nullable: true })
  bankName: string | null;

  @Column({ name: 'refund_proof_image_url', type: 'varchar', length: 512, nullable: true })
  refundProofImageUrl: string | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
  items: OrderItem[];

  @OneToMany(() => OrderStatusLog, (log) => log.order, { eager: false })
  statusLogs: OrderStatusLog[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}