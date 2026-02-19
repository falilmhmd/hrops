import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ResponseDto } from '../../common/dto/response.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ValidationPipe } from '../../common/pipes/validation.pipe';
import { UsePipes, UseInterceptors } from '@nestjs/common';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { IsString, IsNumber } from 'class-validator';

export class CreateExampleDto {
  @IsString()
  name: string;

  @IsNumber()
  age: number;
}

@Controller('example')
@UseInterceptors(ResponseInterceptor)
export class ExampleController {
  @Get('success')
  @HttpCode(HttpStatus.OK)
  getSuccess(): ResponseDto<string> {
    return new ResponseDto({
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Operation completed successfully',
      data: 'This is a successful response',
      timestamp: new Date().toISOString(),
      path: '/example/success',
    });
  }

  @Get('error')
  @HttpCode(HttpStatus.NOT_FOUND)
  getError(): ErrorResponseDto<string> {
    throw new BusinessException(
      'Resource not found',
      HttpStatus.NOT_FOUND,
      'The requested resource does not exist',
    );
  }

  @Post('create')
  @UsePipes(new ValidationPipe())
  create(@Body() createExampleDto: CreateExampleDto): ResponseDto<CreateExampleDto> {
    if (createExampleDto.age < 18) {
      throw new BusinessException(
        'User must be at least 18 years old',
        HttpStatus.BAD_REQUEST,
        'Age validation failed',
      );
    }

    return new ResponseDto({
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Resource created successfully',
      data: createExampleDto,
      timestamp: new Date().toISOString(),
      path: '/example/create',
    });
  }

  @Get('validate-error')
  @UsePipes(new ValidationPipe())
  validateError(@Body() body: any): ResponseDto<string> {
    return new ResponseDto({
      success: true,
      statusCode: HttpStatus.OK,
      message: 'This should never be reached due to validation error',
      data: 'Validation should fail',
      timestamp: new Date().toISOString(),
      path: '/example/validate-error',
    });
  }
}