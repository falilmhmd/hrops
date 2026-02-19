import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Acme Corp', description: 'Organization name (must be unique)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  organizationName: string;

  @ApiProperty({ example: 'John', description: 'Admin first name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Admin last name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: 'admin@acmecorp.com', description: 'Admin email (must be unique)' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: '+919876543210', description: 'Admin phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: 'Admin@1234',
    description: 'Password (min 8 chars, must include uppercase, lowercase, number, special char)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(50)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password: string;
}
