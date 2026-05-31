import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../product/entities/category.entity';
import { CategoryCreateRequestDto, CategoryUpdateRequestDto } from './dto/category-request.dto';
import { CategoryResponseDto } from './dto/pastry-response.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async findById(id: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      id: category.id,
      name: category.name,
      isActive: category.isActive,
    };
  }

  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      isActive: category.isActive,
    }));
  }

  async save(dto: CategoryCreateRequestDto): Promise<CategoryResponseDto> {
    const existing = await this.categoryRepo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new BadRequestException('Category name already exists');
    }

    const category = this.categoryRepo.create({
      name: dto.name,
      isActive: dto.isActive ?? true,
    });

    const saved = await this.categoryRepo.save(category);
    return {
      id: saved.id,
      name: saved.name,
      isActive: saved.isActive,
    };
  }

  async update(id: string, dto: CategoryUpdateRequestDto): Promise<CategoryResponseDto> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (dto.name !== undefined) {
      category.name = dto.name;
    }

    if (dto.isActive !== undefined) {
      category.isActive = dto.isActive;
    }

    const saved = await this.categoryRepo.save(category);
    return {
      id: saved.id,
      name: saved.name,
      isActive: saved.isActive,
    };
  }

  async remove(id: string): Promise<boolean> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    category.isActive = false;
    await this.categoryRepo.save(category);
    return true;
  }
}