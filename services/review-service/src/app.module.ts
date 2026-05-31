import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReviewModule } from './review/review.module';
import { Review } from './review/entities/review.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.REVIEW_DATABASE_URL || process.env.DATABASE_URL || undefined,
      host: process.env.REVIEW_DB_HOST || process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.REVIEW_DB_PORT || process.env.DB_PORT || '5432', 10),
      username: process.env.REVIEW_DB_USERNAME || process.env.DB_USERNAME || 'bakery_user',
      password: process.env.REVIEW_DB_PASSWORD || process.env.DB_PASSWORD || 'bakery_pass',
      database: process.env.REVIEW_DB_DATABASE || process.env.DB_DATABASE || 'bakery_review_db',
      schema: process.env.REVIEW_DB_SCHEMA || process.env.DB_SCHEMA || 'public',
      entities: [Review],
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
    }),
    ReviewModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
