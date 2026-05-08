export type LegacyPastryStatus = 'ACTIVE' | 'DISCONTINUED' | 'DRAFT' | 'OUT_OF_STOCK';

export interface LegacyPastryDto {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  price?: number | null;
  status: LegacyPastryStatus;
  stock_quantity?: number | null;
  category_id?: string | null;
}
