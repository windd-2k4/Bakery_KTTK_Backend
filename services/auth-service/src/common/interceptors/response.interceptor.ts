import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/response.interface';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // Nếu data đã có format ApiResponse, trả về như vậy
        if (data && typeof data === 'object' && 'code' in data && 'message' in data) {
          return data;
        }

        // Nếu không, wrap nó
        return {
          code: 200,
          message: 'Success',
          data: data || null,
        } as ApiResponse;
      }),
    );
  }
}
