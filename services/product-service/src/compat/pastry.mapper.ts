import { Category } from '../product/entities/category.entity';
import { Product } from '../product/entities/product.entity';
import { PastryStatus } from './pastry-status.enum';
import { CategoryResponseDto, PastryResponseDto } from './dto/pastry-response.dto';

export interface PastryMappingRow {
  pastryField: string;
  productField: string;
  note: string;
}

export const PASTRY_PRODUCT_MAPPING: PastryMappingRow[] = [
  { pastryField: 'id', productField: 'id', note: 'UUID identifier' },
  { pastryField: 'name', productField: 'name', note: 'Pastry/product name' },
  { pastryField: 'price', productField: 'price', note: 'Selling price' },
  { pastryField: 'description', productField: 'description', note: 'Long description' },
  { pastryField: 'imageUrl', productField: 'imageUrl', note: 'Main image URL' },
  { pastryField: 'stockQuantity', productField: 'stock', note: 'Inventory count' },
  { pastryField: 'status', productField: 'status', note: 'DRAFT/ACTIVE/OUT_OF_STOCK/DISCONTINUED' },
  { pastryField: 'categoryId', productField: 'category.id', note: 'Foreign key category' },
  { pastryField: 'categoryName', productField: 'category.name', note: 'Category display name' },
];

export function deriveAvailability(status: PastryStatus): boolean {
  return status === PastryStatus.ACTIVE;
}

export function normalizeStockQuantity(value?: number): number {
  if (value === undefined || value === null) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

export function buildSlug(input: string): string {
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

export function mapCategoryToResponse(category: Category): CategoryResponseDto {
  return {
    id: category.id,
    name: category.name,
    isActive: category.isActive,
  };
}

export function mapProductToPastry(product: Product): PastryResponseDto {
  return {
    id: product.id,
    name: product.name,
    price: Number(product.price),
    description: product.description,
    imageUrl: product.imageUrl,
    stockQuantity: Number(product.stock ?? 0),
    status: product.status,
    categoryId: product.category?.id ?? null,
    categoryName: product.category?.name ?? null,
  };
}