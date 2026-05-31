import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CartModule } from './cart/cart.module';
import { Cart } from './cart/entities/cart.entity';
import { CartItem } from './cart/entities/cart-item.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.CART_DATABASE_URL || process.env.DATABASE_URL || undefined,
      host: process.env.CART_DB_HOST || process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.CART_DB_PORT || process.env.DB_PORT || '5432', 10),
      username: process.env.CART_DB_USERNAME || process.env.DB_USERNAME || 'bakery_user',
      password: process.env.CART_DB_PASSWORD || process.env.DB_PASSWORD || 'bakery_pass',
      database: process.env.CART_DB_DATABASE || process.env.DB_DATABASE || 'bakery_cart_db',
      schema: process.env.CART_DB_SCHEMA || process.env.DB_SCHEMA || 'public',
      entities: [Cart, CartItem],
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
    }),
    CartModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
