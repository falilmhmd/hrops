import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseDto } from '../dto/response.dto';
import { Request } from 'express';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: Request = context.switchToHttp().getRequest();
    const path = request.url;

    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;

        return new ResponseDto({
          success: true,
          statusCode,
          message: this.getSuccessMessage(statusCode),
          data,
          timestamp: new Date().toISOString(),
          path,
        });
      }),
    );
  }

  private getSuccessMessage(statusCode: number): string {
    const messages: Record<number, string> = {
      [HttpStatus.OK]: 'Operation completed successfully',
      [HttpStatus.CREATED]: 'Resource created successfully',
      [HttpStatus.ACCEPTED]: 'Request accepted',
      [HttpStatus.NO_CONTENT]: 'No content',
    };

    return messages[statusCode] || 'Operation completed successfully';
  }
}