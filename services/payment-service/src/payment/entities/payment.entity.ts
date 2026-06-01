import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { PaymentMethod, PaymentStatus } from '../enums/payment.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid', { name: 'order_id' })
  orderId: string;

  @Column('uuid', { name: 'user_id', nullable: true })
  userId?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ name: 'provider_reference', type: 'varchar', length: 255, nullable: true })
  providerReference?: string | null;

  @Column({ name: 'payment_content', type: 'varchar', length: 255, nullable: true })
  paymentContent?: string | null;

  @Column({ name: 'payment_url', type: 'varchar', length: 1000, nullable: true })
  paymentUrl?: string | null;

  @Column({ name: 'qr_payload', type: 'jsonb', nullable: true })
  qrPayload?: Record<string, unknown> | null;

  @Column({ name: 'provider_data', type: 'jsonb', nullable: true })
  providerData?: Record<string, unknown> | null;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
