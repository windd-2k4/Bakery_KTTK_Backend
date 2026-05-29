import { Controller, Get } from '@nestjs/common';
import { ApiResponse } from './common/api-response';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return ApiResponse.success(
      { status: 'ok', service: 'cart-service' },
      'Cart service is healthy',
    );
  }
}
