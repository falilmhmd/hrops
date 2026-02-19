import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString, IsOptional } from 'class-validator';

export class ResponseDto<T = any> {
  @ApiProperty({ description: 'Indicates if the request was successful', example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'HTTP status code', example: 200 })
  @IsNumber()
  statusCode: number;

  @ApiProperty({ description: 'Response message', example: 'Operation completed successfully' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Response data', required: false })
  @IsOptional()
  data?: T;

  @ApiProperty({ description: 'Timestamp of the response', example: '2024-01-01T00:00:00.000Z' })
  @IsString()
  timestamp: string;

  @ApiProperty({ description: 'Request path', example: '/api/users' })
  @IsString()
  path: string;

  constructor(partial: Partial<ResponseDto<T>>) {
    Object.assign(this, partial);
  }
}