import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsDateString,
    IsEnum,
    IsBoolean,
    IsArray,
    IsUUID,
    MaxLength,
} from 'class-validator';
import { HolidayType } from '../../../database/entities/holiday.entity';

export class CreateHolidayDto {
    @ApiProperty({ description: 'Name of the holiday', example: 'Independence Day' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @ApiPropertyOptional({ description: 'Description of the holiday' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Date of the holiday', example: '2026-08-15' })
    @IsDateString()
    date: string;

    @ApiProperty({
        description: 'Type of holiday',
        enum: HolidayType,
        default: HolidayType.PUBLIC,
        example: HolidayType.PUBLIC,
    })
    @IsOptional()
    @IsEnum(HolidayType)
    type?: HolidayType;

    @ApiPropertyOptional({
        description: 'Single location for the holiday',
        example: 'Mumbai',
    })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiPropertyOptional({
        description: 'Multiple locations for the holiday',
        example: ['Mumbai', 'Delhi', 'Bangalore'],
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    locations?: string[];

    @ApiPropertyOptional({
        description: 'Whether the holiday recurs every year',
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    isRecurring?: boolean;

    @ApiPropertyOptional({ description: 'Organization ID' })
    @IsOptional()
    @IsUUID()
    organizationId?: string;
}