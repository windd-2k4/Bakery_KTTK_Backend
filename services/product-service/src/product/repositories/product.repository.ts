import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly ormRepo: Repository<Product>,
  ) {}

  create(data: Partial<Product>): Product {
    return this.ormRepo.create(data);
  }

  save(entity: Product): Promise<Product> {
    return this.ormRepo.save(entity);
  }

  async findById(id: string): Promise<Product | null> {
    return this.ormRepo.findOne({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return this.ormRepo.findOne({ where: { slug } });
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.ormRepo.delete(id);
    return !!result.affected;
  }

  queryBuilder(alias: string) {
    return this.ormRepo.createQueryBuilder(alias);
  }

  updateById(id: string, data: Partial<Product>) {
    return this.ormRepo.update(id, data);
  }
}
