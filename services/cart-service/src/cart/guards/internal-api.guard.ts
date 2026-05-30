import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class InternalApiGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expectedKey = this.configService.get<string>('INTERNAL_API_KEY');
    if (!expectedKey) {
      throw new UnauthorizedException('Internal API is not configured');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.header('x-internal-api-key');

    if (!providedKey || providedKey !== expectedKey) {
      throw new UnauthorizedException('Invalid internal API key');
    }

    return true;
  }
}
