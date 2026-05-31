import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../product/entities/category.entity';
import { Product } from '../product/entities/product.entity';
import { AdminCategoryController } from './admin-category.controller';
import { AdminPastryController } from './admin-pastry.controller';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { PastryController } from './pastry.controller';
import { PastryService } from './pastry.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category])],
  controllers: [PastryController, AdminPastryController, CategoryController, AdminCategoryController],
  providers: [PastryService, CategoryService],
})
export class CompatModule {}