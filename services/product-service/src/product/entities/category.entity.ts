import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('categories')
export class Category {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ unique: true })
	name: string;

	@Column({ unique: true })
	slug: string;

	@Column({ type: 'text', nullable: true })
	description?: string;

	@Column({ name: 'image_url', nullable: true })
	imageUrl?: string;

	@Column({ name: 'is_active', default: true })
	isActive: boolean;

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date;

	@OneToMany(() => Product, (product) => product.category)
	products: Product[];
}
