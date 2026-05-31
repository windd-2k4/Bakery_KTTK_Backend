import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly ormRepo: Repository<Category>,
  ) {}

  async existsById(id: string): Promise<boolean> {
    return this.ormRepo.exists({ where: { id } });
  }
}
