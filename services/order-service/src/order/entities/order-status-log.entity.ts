import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('order_status_logs')
export class OrderStatusLog {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() orderId: string;
  @Column({ nullable: true }) fromStatus: string;
  @Column() toStatus: string;
  @Column() changedBy: string;   // userId
  @Column() actorRole: string;
  @Column({ nullable: true }) note: string;
  @CreateDateColumn() createdAt: Date;
}