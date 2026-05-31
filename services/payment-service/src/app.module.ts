import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentModule } from './payment/payment.module';
import { Payment } from './payment/entities/payment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.PAYMENT_DATABASE_URL || process.env.DATABASE_URL || undefined,
      host: process.env.PAYMENT_DB_HOST || process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.PAYMENT_DB_PORT || process.env.DB_PORT || '5432', 10),
      username: process.env.PAYMENT_DB_USERNAME || process.env.DB_USERNAME || 'bakery_user',
      password: process.env.PAYMENT_DB_PASSWORD || process.env.DB_PASSWORD || 'bakery_pass',
      database: process.env.PAYMENT_DB_DATABASE || process.env.DB_DATABASE || 'bakery_payment_db',
      schema: process.env.PAYMENT_DB_SCHEMA || process.env.DB_SCHEMA || 'public',
      entities: [Payment],
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
    }),
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
