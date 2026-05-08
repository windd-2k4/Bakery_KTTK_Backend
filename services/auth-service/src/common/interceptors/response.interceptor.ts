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
        // Nếu data đã là instance của ApiResponse, trả về luôn
        if (data instanceof ApiResponse) {
          return data;
        }

        // Nếu data có cấu trúc giống ApiResponse, bọc lại bằng class
        if (data && typeof data === 'object' && 'code' in data && 'message' in data) {
          return new ApiResponse(data.code, data.message, data.data);
        }

        // Nếu không, wrap nó với code 200 mặc định
        return new ApiResponse(200, 'Success', data || null);
      }),
    );
  }
}
