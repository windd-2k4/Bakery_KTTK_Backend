import { Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards, Req, Logger, BadRequestException } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Controller('reviews')
export class ReviewController {
  private readonly logger = new Logger(ReviewController.name);

  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  async create(@Body() createReviewDto: CreateReviewDto, @Req() req: any) {
    const userId = req.user?.id || req.body.userId;
    if (!userId) throw new BadRequestException('User ID is required');
    
    this.logger.log(`Creating review for product ${createReviewDto.productId} by user ${userId}`);
    return this.reviewService.create(userId, createReviewDto);
  }

  @Get('product/:productId')
  async getByProduct(
    @Param('productId') productId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    this.logger.log(`Fetching reviews for product ${productId}`);
    return this.reviewService.findByProduct(productId, page, limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log(`Fetching review ${id}`);
    return this.reviewService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto, @Req() req: any) {
    const userId = req.user?.id;
    this.logger.log(`Updating review ${id} by user ${userId}`);
    return this.reviewService.update(id, userId, updateReviewDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    this.logger.log(`Deleting review ${id} by user ${userId}`);
    await this.reviewService.remove(id, userId);
    return { message: 'Review deleted successfully' };
  }

  @Get()
  async getMyReviews(@Req() req: any, @Query('page') page: number = 1) {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestException('User ID is required');
    
    this.logger.log(`Fetching reviews by user ${userId}`);
    return this.reviewService.findByUser(userId, page);
  }
}
