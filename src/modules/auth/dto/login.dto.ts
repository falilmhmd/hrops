import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@acmecorp.com', description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Admin@1234', description: 'User password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
