import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    @InjectRepository(Review)
    private reviewRepo: Repository<Review>,
    private httpService: HttpService,   // gọi HTTP đến Product Service
  ) {}
 
  async create(userId: string, dto: CreateReviewDto): Promise<Review> {
    try {
      // 1. Kiểm tra user đã mua sản phẩm trong đơn này chưa
      const hasPurchased = await this.verifyPurchase(userId, dto.orderId, dto.productId);
      if (!hasPurchased) {
        throw new ForbiddenException('Bạn chưa mua sản phẩm này');
      }

      // 2. Check if user already reviewed this product
      const existingReview = await this.reviewRepo.findOne({
        where: { userId, productId: dto.productId },
      });
      if (existingReview) {
        throw new BadRequestException('Bạn đã review sản phẩm này rồi');
      }
 
      // 3. Tạo review
      const review = await this.reviewRepo.save({
        userId,
        productId: dto.productId,
        orderId: dto.orderId,
        rating: dto.rating,
        comment: dto.comment,
        images: dto.images,
      });

      this.logger.log(`Review created: ${review.id}`);
 
      // 4. Tính lại avgRating và sync về Product Service
      await this.syncRatingToProduct(dto.productId);
 
      return review;
    } catch (error) {
      this.logger.error('Failed to create review', error);
      throw error;
    }
  }
 
  private async syncRatingToProduct(productId: string) {
    try {
      const result = await this.reviewRepo
        .createQueryBuilder('r')
        .select('AVG(r.rating)', 'avg')
        .addSelect('COUNT(*)', 'count')
        .where('r.productId = :productId AND r.isHidden = false', { productId })
        .getRawOne();

      const avgRating = parseFloat(result?.avg) || 0;
      const reviewCount = parseInt(result?.count) || 0;
 
      // Gọi HTTP PATCH đến Product Service để cập nhật
      await this.httpService.axiosRef.patch(
        `${process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003'}/products/${productId}/rating`,
        { avgRating, reviewCount },
      );

      this.logger.debug(`Rating synced for product ${productId}: avg=${avgRating}, count=${reviewCount}`);
    } catch (error) {
      this.logger.error('Failed to sync rating to product service', error);
    }
  }
 
  async findByProduct(productId: string, page = 1, limit = 10) {
    const [data, total] = await this.reviewRepo.findAndCount({
      where: { productId, isHidden: false },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }
}

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) {
      throw new NotFoundException(`Review with id ${id} not found`);
    }
    return review;
  }

  async findByUser(userId: string, page = 1, limit = 10) {
    const [data, total] = await this.reviewRepo.findAndCount({
      where: { userId, isHidden: false },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async update(id: string, userId: string, dto: UpdateReviewDto): Promise<Review> {
    const review = await this.findOne(id);

    if (review.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa review này');
    }

    Object.assign(review, dto);
    const updated = await this.reviewRepo.save(review);

    await this.syncRatingToProduct(review.productId);

    this.logger.log(`Review ${id} updated`);
    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const review = await this.findOne(id);

    if (review.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa review này');
    }

    await this.reviewRepo.remove(review);
    await this.syncRatingToProduct(review.productId);

    this.logger.log(`Review ${id} deleted`);
  }

  private async verifyPurchase(userId: string, orderId: string, productId: string): Promise<boolean> {
    try {
      const response = await this.httpService.axiosRef.get(
        `${process.env.ORDER_SERVICE_URL || 'http://localhost:3001'}/orders/${orderId}`,
      );

      const order = response.data;
      if (order.userId !== userId) {
        return false;
      }

      const hasPurchased = order.items?.some((item: any) => item.productId === productId);
      return !!hasPurchased;
    } catch (error) {
      this.logger.error('Failed to verify purchase', error);
      return false;
    }
  }