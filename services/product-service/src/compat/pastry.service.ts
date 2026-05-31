import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../product/entities/category.entity';
import { Product } from '../product/entities/product.entity';
import { PastryCreateRequestDto, PastryUpdateRequestDto } from './dto/pastry-request.dto';
import { PastryResponseDto } from './dto/pastry-response.dto';
import { PastryStatus } from './pastry-status.enum';
import {
  buildSlug,
  deriveAvailability,
  mapProductToPastry,
  normalizeStockQuantity,
} from './pastry.mapper';

@Injectable()
export class PastryService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async findById(id: string): Promise<PastryResponseDto> {
    const product = await this.productRepo.findOne({ where: { id }, relations: ['category'] });
    if (!product) {
      throw new NotFoundException('Pastry not found');
    }

    return mapProductToPastry(product);
  }

  async findAll(): Promise<PastryResponseDto[]> {
    const items = await this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .where('p.status = :status', { status: PastryStatus.ACTIVE })
      .andWhere('category.is_active = true')
      .orderBy('p.created_at', 'DESC')
      .getMany();

    return items.map(mapProductToPastry);
  }

  async findByCategory(categoryId: string): Promise<PastryResponseDto[]> {
    if (!categoryId || !categoryId.trim()) {
      return this.findAll();
    }

    const items = await this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .where('p.status = :status', { status: PastryStatus.ACTIVE })
      .andWhere('category.is_active = true')
      .andWhere('p.category_id = :categoryId', { categoryId })
      .orderBy('p.created_at', 'DESC')
      .getMany();

    return items.map(mapProductToPastry);
  }

  async search(keyword: string): Promise<PastryResponseDto[]> {
    if (!keyword || !keyword.trim()) {
      return this.findAll();
    }

    const items = await this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .where('p.status = :status', { status: PastryStatus.ACTIVE })
      .andWhere('category.is_active = true')
      .andWhere('(LOWER(p.name) LIKE LOWER(:keyword) OR LOWER(p.description) LIKE LOWER(:keyword))', {
        keyword: `%${keyword.trim()}%`,
      })
      .orderBy('p.created_at', 'DESC')
      .getMany();

    return items.map(mapProductToPastry);
  }

  async findAllAdmin(): Promise<PastryResponseDto[]> {
    const items = await this.productRepo.find({ relations: ['category'] });
    return items.map(mapProductToPastry);
  }

  async searchAdmin(keyword: string): Promise<PastryResponseDto[]> {
    if (!keyword || !keyword.trim()) {
      return this.findAllAdmin();
    }

    const items = await this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .where('(LOWER(p.name) LIKE LOWER(:keyword) OR LOWER(p.description) LIKE LOWER(:keyword))', {
        keyword: `%${keyword.trim()}%`,
      })
      .orderBy('p.created_at', 'DESC')
      .getMany();

    return items.map(mapProductToPastry);
  }

  async save(dto: PastryCreateRequestDto): Promise<PastryResponseDto> {
    const slug = buildSlug(dto.name);
    const existing = await this.productRepo.findOne({ where: { slug } });
    if (existing) {
      throw new BadRequestException('Pastry slug already exists');
    }

    let category: Category | null = null;
    if (dto.categoryId) {
      category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (!category) {
        throw new BadRequestException(`Category ${dto.categoryId} not found`);
      }
    }

    const status = dto.status ?? PastryStatus.DRAFT;
    const product = this.productRepo.create({
      name: dto.name,
      slug,
      description: dto.description ?? null,
      price: dto.price,
      stock: normalizeStockQuantity(dto.stockQuantity),
      imageUrl: dto.imageUrl ?? null,
      images: [],
      status,
      isAvailable: deriveAvailability(status),
      category: category ?? undefined,
      avgRating: 0,
      reviewCount: 0,
    });

    const saved = await this.productRepo.save(product);
    const loaded = await this.productRepo.findOne({ where: { id: saved.id }, relations: ['category'] });

    if (!loaded) {
      throw new NotFoundException('Pastry not found after save');
    }

    return mapProductToPastry(loaded);
  }

  async update(id: string, dto: PastryUpdateRequestDto): Promise<PastryResponseDto> {
    const product = await this.productRepo.findOne({ where: { id }, relations: ['category'] });
    if (!product) {
      throw new NotFoundException('Pastry not found');
    }

    if (dto.categoryId !== undefined) {
      if (!dto.categoryId.trim()) {
        product.category = null as never;
      } else {
        const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
        if (!category) {
          throw new BadRequestException(`Category ${dto.categoryId} not found`);
        }
        product.category = category;
      }
    }

    if (dto.name !== undefined) {
      product.name = dto.name;
      product.slug = buildSlug(dto.name);
    }

    if (dto.price !== undefined) {
      product.price = dto.price;
    }

    if (dto.description !== undefined) {
      product.description = dto.description;
    }

    if (dto.imageUrl !== undefined) {
      product.imageUrl = dto.imageUrl;
    }

    if (dto.stockQuantity !== undefined) {
      product.stock = normalizeStockQuantity(dto.stockQuantity);
      if (product.stock === 0 && dto.status === undefined && product.status === PastryStatus.ACTIVE) {
        product.status = PastryStatus.OUT_OF_STOCK;
      }
    }

    if (dto.status !== undefined) {
      product.status = dto.status;
    }

    product.isAvailable = deriveAvailability(product.status);

    const saved = await this.productRepo.save(product);
    const loaded = await this.productRepo.findOne({ where: { id: saved.id }, relations: ['category'] });

    if (!loaded) {
      throw new NotFoundException('Pastry not found after update');
    }

    return mapProductToPastry(loaded);
  }

  async remove(id: string): Promise<boolean> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Pastry not found');
    }

    product.status = PastryStatus.DISCONTINUED;
    product.isAvailable = false;
    await this.productRepo.save(product);
    return true;
  }
}