// src/users/entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
 
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;
 
  @Column({ unique: true })
  email: string;
 
  @Column()
  password: string;

  @Column({ name: 'full_name' })
  fullName: string;
 
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;
 
  @Column({ type: 'enum', enum: ['CUSTOMER', 'ADMIN', 'BAKER'], default: 'CUSTOMER' })
  role: string;
 
  @Column({ default: true })
  isActive: boolean;
 
  @Column({ type: 'text', nullable: true })
  refreshToken: string | null;
 
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
 
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}