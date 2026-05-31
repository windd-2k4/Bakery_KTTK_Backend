import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { OrderStatus } from '../enums/order-status.enum';

@Entity('order_status_logs')
export class OrderStatusLog {
  @PrimaryGeneratedColumn('uuid') id: string;

  @ManyToOne(() => Order, (order) => order.statusLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId: string | null;

  @Column({
    name: 'from_status',
    type: 'enum',
    enum: OrderStatus,
    enumName: 'order_status',
    nullable: true,
  })
  fromStatus: OrderStatus | null;

  @Column({
    name: 'to_status',
    type: 'enum',
    enum: OrderStatus,
    enumName: 'order_status',
  })
  toStatus: OrderStatus;

  @Column({ name: 'changed_by', type: 'uuid', nullable: true })
  changedBy: string | null;

  @Column({ name: 'actor_role', type: 'varchar', length: 20, nullable: true })
  actorRole: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}