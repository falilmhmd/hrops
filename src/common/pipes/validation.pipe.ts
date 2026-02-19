import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ErrorResponseDto } from '../dto/error-response.dto';

@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    if (!value) {
      throw new BadRequestException(
        new ErrorResponseDto({
          success: false,
          statusCode: 400,
          message: 'No data submitted',
          timestamp: new Date().toISOString(),
          path: '',
        }),
      );
    }

    const { metatype } = metadata;
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const formattedErrors = this.formatValidationErrors(errors);
      throw new BadRequestException(
        new ErrorResponseDto({
          success: false,
          statusCode: 400,
          message: 'Validation failed',
          error: formattedErrors,
          timestamp: new Date().toISOString(),
          path: '',
        }),
      );
    }

    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatValidationErrors(errors: any[]): string {
    return errors
      .map((error) => {
        const constraints = Object.values(error.constraints || {});
        return constraints.join(', ');
      })
      .join('; ');
  }
}