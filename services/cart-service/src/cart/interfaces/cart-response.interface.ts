export interface CartItemResponse {
  id: string;
  productId: string;
  quantity: number;
  addedAt: Date;
}

export interface CartResponse {
  id: string;
  userId: string;
  items: CartItemResponse[];
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}
