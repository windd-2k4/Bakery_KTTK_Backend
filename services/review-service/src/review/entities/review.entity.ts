import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Entity('reviews')
@Unique(['userId', 'productId', 'orderId'])  // chống review trùng
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  productId: string;

  @Column()
  orderId: string;     // bắt buộc phải có đơn thật

  @Column({ type: 'smallint' })
  rating: number;   // 1-5

  @Column('text', { nullable: true })
  comment: string;

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column({ default: false })
  isHidden: boolean;

  @CreateDateColumn()
  createdAt: Date;
}