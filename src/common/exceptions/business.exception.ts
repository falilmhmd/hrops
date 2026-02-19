import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorResponseDto } from '../dto/error-response.dto';

export class BusinessException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    error?: string,
  ) {
    super(
      new ErrorResponseDto({
        success: false,
        statusCode,
        message,
        error,
        timestamp: new Date().toISOString(),
        path: '',
      }),
      statusCode,
    );
  }
}