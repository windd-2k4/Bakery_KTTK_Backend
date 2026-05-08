export class AddItemDto {
	productId: string;
	productName?: string;
	price: number;
	quantity: number;
	imageUrl?: string;
}

export default AddItemDto;
