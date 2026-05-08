import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PaymentMethod, PaymentStatus } from '../enums/payment.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'order_id' })
  orderId: string;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ name: 'transaction_id', nullable: true })
  transactionId: string | null;

  @Column({ nullable: true })
  reference: string | null;

  @Column({ nullable: true })
  description: string | null;

  @Column({ name: 'response_code', nullable: true })
  responseCode: string | null;

  @Column({ name: 'response_message', nullable: true })
  responseMessage: string | null;

  @Column({ name: 'payment_url', nullable: true })
  paymentUrl: string | null;

  @Column({ name: 'provider_data', type: 'jsonb', nullable: true })
  providerData?: Record<string, any>;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
