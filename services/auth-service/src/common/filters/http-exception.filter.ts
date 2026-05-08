import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../interfaces/response.interface';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = 'An error occurred';
    let errors: any = null;

    if (typeof exceptionResponse === 'object') {
      message =
        (exceptionResponse as any)?.message || message;
      errors = (exceptionResponse as any)?.error;
    }

    const apiResponse: ApiResponse = {
      code: status,
      message,
      data: errors || null,
    };

    response.status(status).json(apiResponse);
  }
}
