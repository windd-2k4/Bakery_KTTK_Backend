import { PastryStatus } from '../pastry-status.enum';

export class PastryResponseDto {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  imageUrl?: string | null;
  stockQuantity: number;
  status: PastryStatus;
  categoryId?: string | null;
  categoryName?: string | null;
}

export class CategoryResponseDto {
  id: string;
  name: string;
  isActive: boolean;
}