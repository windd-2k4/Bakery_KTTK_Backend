import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import type { ApiResponse } from './common/interfaces/response.interface';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  health(): ApiResponse<{ status: string }> {
    return {
      code: 200,
      message: 'Auth service is running',
      data: this.appService.getHealth(),
    };
  }
}

