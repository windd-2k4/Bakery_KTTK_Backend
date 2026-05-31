import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL || undefined,
      host: process.env.AUTH_DB_HOST || process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.AUTH_DB_PORT || process.env.DB_PORT || '5432', 10),
      username: process.env.AUTH_DB_USERNAME || process.env.DB_USERNAME || 'bakery_user',
      password: process.env.AUTH_DB_PASSWORD || process.env.DB_PASSWORD || 'bakery_pass',
      database: process.env.AUTH_DB_DATABASE || process.env.DB_DATABASE || 'bakery_auth_db',
      schema: process.env.AUTH_DB_SCHEMA || process.env.DB_SCHEMA || 'public',
      entities: [User],
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
    }),
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
