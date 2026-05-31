import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { ApiResponse } from '../common/api-response';
import { ProductRepository } from './repositories/product.repository';
import { CategoryRepository } from './repositories/category.repository';

interface ProductSnapshot {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepo: ProductRepository,
    private readonly categoryRepo: CategoryRepository,
  ) {}

  async create(dto: CreateProductDto): Promise<ApiResponse<Product>> {
    const slug = this.buildSlug(dto.slug || dto.name);

    const existingBySlug = await this.productRepo.findBySlug(slug);
    if (existingBySlug) {
      throw new BadRequestException('Product slug already exists');
    }

    if (dto.categoryId) {
      const categoryExists = await this.categoryRepo.existsById(dto.categoryId);
      if (!categoryExists) {
        throw new BadRequestException(`Category ${dto.categoryId} not found`);
      }
    }

    const product = this.productRepo.create({
      ...dto,
      slug,
      ...(dto.categoryId ? { category: { id: dto.categoryId } as Category } : {}),
    });

    const saved = await this.productRepo.save(product);
    return ApiResponse.success(saved, 'Product created', 201);
  }

  async findAll(filter: FilterProductDto): Promise<ApiResponse<{
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    const {
      search,
      categoryId,
      minPrice,
      maxPrice,
      isAvailable,
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      order = 'DESC',
    } = filter;

    const qb = this.productRepo.queryBuilder('p').leftJoinAndSelect('p.category', 'category');

    if (search) {
      qb.andWhere('p.name ILIKE :search', { search: `%${search}%` });
    }
    if (categoryId) {
      qb.andWhere('p.category_id = :categoryId', { categoryId });
    }
    if (minPrice !== undefined) {
      qb.andWhere('p.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      qb.andWhere('p.price <= :maxPrice', { maxPrice });
    }
    if (isAvailable !== undefined) {
      qb.andWhere('p.is_available = :isAvailable', { isAvailable });
    }

    const sortColumnMap: Record<string, string> = {
      createdAt: 'p.created_at',
      updatedAt: 'p.updated_at',
      price: 'p.price',
      avgRating: 'p.avg_rating',
      reviewCount: 'p.review_count',
      name: 'p.name',
    };

    const [data, total] = await qb
      .orderBy(sortColumnMap[sortBy] || 'p.created_at', order)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return ApiResponse.success({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }

  async findOne(id: string): Promise<ApiResponse<Product>> {
    const product = await this.productRepo.findById(id);
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return ApiResponse.success(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ApiResponse<Product>> {
    const productEntity = await this.productRepo.findById(id);
    if (!productEntity) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    if (dto.categoryId) {
      const categoryExists = await this.categoryRepo.existsById(dto.categoryId);
      if (!categoryExists) {
        throw new BadRequestException(`Category ${dto.categoryId} not found`);
      }
    }

    Object.assign(productEntity, {
      ...dto,
      ...(dto.name ? { slug: this.buildSlug(dto.slug || dto.name) } : {}),
      ...(dto.categoryId ? { category: { id: dto.categoryId } as Category } : {}),
    });

    const saved = await this.productRepo.save(productEntity);
    return ApiResponse.success(saved, 'Product updated');
  }

  async remove(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    const deleted = await this.productRepo.deleteById(id);
    if (!deleted) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return ApiResponse.success({ deleted: true }, 'Product deleted');
  }

  async updateRating(id: string, avgRating: number, reviewCount: number) {
    return this.productRepo.updateById(id, { avgRating, reviewCount });
  }

  async findSnapshot(id: string): Promise<ProductSnapshot> {
    const product = await this.productRepo.findById(id);
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      isAvailable: product.isAvailable,
    };
  }

  private buildSlug(input: string): string {
    return input
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

}