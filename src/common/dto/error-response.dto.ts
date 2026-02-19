import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString, IsOptional } from 'class-validator';
import { ResponseDto } from './response.dto';

export class ErrorResponseDto<T = any> extends ResponseDto<T> {
  @ApiProperty({ description: 'Indicates if the request was successful', example: false })
  @IsBoolean()
  success: boolean = false;

  @ApiProperty({ description: 'Detailed error information', required: false })
  @IsOptional()
  error?: string;

  constructor(partial: Partial<ErrorResponseDto<T>>) {
    super(partial);
    this.success = false;
  }
}