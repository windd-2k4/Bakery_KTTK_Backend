import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentModule } from './payment/payment.module';
import { Payment } from './payment/entities/payment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        host: configService.get<string>('DB_HOST') ?? 'bakery_db',
        port: Number(configService.get<string>('DB_PORT') ?? 5432),
        username: configService.get<string>('DB_USERNAME') ?? 'bakery_user',
        password: configService.get<string>('DB_PASSWORD') ?? 'bakery_pass',
        database: configService.get<string>('DB_DATABASE') ?? 'bakery_db',
        entities: [Payment],
        synchronize: false,
        autoLoadEntities: true,
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    PaymentModule,
  ],
})
export class AppModule {}
