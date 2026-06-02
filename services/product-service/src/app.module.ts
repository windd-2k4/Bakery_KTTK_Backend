import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './product/product.module';
import { Product } from './product/entities/product.entity';
import { Category } from './product/entities/category.entity';
import { CompatModule } from './compat/compat.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.PRODUCT_DATABASE_URL || process.env.DATABASE_URL || undefined,
      host: process.env.PRODUCT_DB_HOST || process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.PRODUCT_DB_PORT || process.env.DB_PORT || '5432', 10),
      username: process.env.PRODUCT_DB_USERNAME || process.env.DB_USERNAME || 'bakery_user',
      password: process.env.PRODUCT_DB_PASSWORD || process.env.DB_PASSWORD || 'bakery_pass',
      database: process.env.PRODUCT_DB_DATABASE || process.env.DB_DATABASE || 'bakery_product_db',
      schema: process.env.PRODUCT_DB_SCHEMA || process.env.DB_SCHEMA || 'public',
      entities: [Product, Category],
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
    }),
    ProductModule,
    CompatModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}