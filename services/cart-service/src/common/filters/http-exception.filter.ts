import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
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
    let errors: unknown = null;

    if (typeof exceptionResponse === 'object') {
      message = (exceptionResponse as { message?: string }).message ?? message;
      errors = (exceptionResponse as { error?: unknown }).error;
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    }

    const apiResponse: ApiResponse = {
      code: status,
      message: Array.isArray(message) ? message.join(', ') : message,
      data: errors ?? null,
    };

    response.status(status).json(apiResponse);
  }
}
