import {
  Entity, Column, PrimaryGeneratedColumn, ManyToOne,
  CreateDateColumn, UpdateDateColumn, JoinColumn
} from 'typeorm';
import { Category } from './category.entity';
import { PastryStatus } from '../../compat/pastry-status.enum';
 
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;
 
  @Column({ type: 'varchar', length: 255 }) name: string;
  @Column({ type: 'varchar', length: 255, unique: true }) slug: string;
  @Column('text', { nullable: true }) description: string | null;
  @Column('decimal', { precision: 10, scale: 2 }) price: number;
  @Column({ default: 0 }) stock: number;
  @Column({ type: 'varchar', name: 'image_url', length: 500, nullable: true }) imageUrl: string | null;
  @Column({ type: 'varchar', array: true, nullable: true }) images: string[];
  @Column({ name: 'is_available', default: true }) isAvailable: boolean;
  @Column({ type: 'enum', enum: PastryStatus, default: PastryStatus.ACTIVE })
  status: PastryStatus;
  @Column('decimal', { name: 'avg_rating', precision: 3, scale: 2, default: 0 }) avgRating: number;
  @Column({ name: 'review_count', default: 0 }) reviewCount: number;
 
  @ManyToOne(() => Category, (cat) => cat.products, { eager: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'category_id', type: 'uuid', nullable: true, select: false, insert: false, update: false })
  categoryId?: string;
 
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}