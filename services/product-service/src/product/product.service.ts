import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { LegacyPastryDto, LegacyPastryStatus } from './dto/legacy-pastry.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { ApiResponse } from '../common/api-response';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async create(dto: CreateProductDto): Promise<ApiResponse<Product>> {
    const slug = this.buildSlug(dto.slug || dto.name);

    const product = this.productRepo.create({
      ...dto,
      slug,
      category: { id: dto.categoryId } as Category,
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

    const qb = this.productRepo.createQueryBuilder('p').leftJoinAndSelect('p.category', 'category');

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
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return ApiResponse.success(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ApiResponse<Product>> {
    const productEntity = await this.productRepo.findOne({ where: { id } });
    if (!productEntity) {
      throw new NotFoundException(`Product ${id} not found`);
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
    const result = await this.productRepo.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return ApiResponse.success({ deleted: true }, 'Product deleted');
  }

  async updateRating(id: string, avgRating: number, reviewCount: number) {
    return this.productRepo.update(id, { avgRating, reviewCount });
  }

  async migrateLegacyPastries(
    legacyPastries: LegacyPastryDto[],
    categoryIdMap: Record<string, string>,
  ): Promise<ApiResponse<Product[]>> {
    const migrated: Product[] = [];

    for (const legacyPastry of legacyPastries) {
      const slug = this.buildSlug(legacyPastry.name);
      const existing = await this.productRepo.findOne({ where: { slug } });
      if (existing) {
        migrated.push(existing);
        continue;
      }

      const entity = this.productRepo.create();
      entity.name = legacyPastry.name;
      entity.slug = slug;
      entity.description = legacyPastry.description ?? null;
      entity.price = legacyPastry.price ?? 0;
      entity.stock = legacyPastry.stock_quantity ?? 0;
      entity.imageUrl = legacyPastry.image_url ?? null;
      entity.isAvailable = this.mapLegacyStatusToAvailability(legacyPastry.status);
      if (legacyPastry.category_id && categoryIdMap[legacyPastry.category_id]) {
        entity.category = { id: categoryIdMap[legacyPastry.category_id] } as Category;
      }

      const saved = await this.productRepo.save(entity);
      migrated.push(saved);
    }

    return ApiResponse.success(migrated, 'Legacy pastries migrated');
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

  private mapLegacyStatusToAvailability(status: LegacyPastryStatus): boolean {
    return status === 'ACTIVE';
  }
}