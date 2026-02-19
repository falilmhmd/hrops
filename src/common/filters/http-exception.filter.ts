import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorResponseDto } from '../dto/error-response.dto';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest();

    const status = exception.getStatus();
const errorResponse = exception.getResponse() as { message?: string; error?: string; name?: string };

    let message = 'An error occurred';
    let error: string | undefined;

    if (typeof errorResponse === 'object') {
      message = errorResponse.message || message;
      error = errorResponse.error || errorResponse.name;
    } else {
      message = errorResponse;
    }

    const errorData = new ErrorResponseDto({
      success: false,
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });

    response.status(status).json(errorData);
  }
}