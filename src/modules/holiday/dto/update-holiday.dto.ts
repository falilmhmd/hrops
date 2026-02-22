import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsDateString,
    IsEnum,
    IsBoolean,
    IsArray,
    IsUUID,
    MaxLength,
} from 'class-validator';
import { HolidayType } from '../../../database/entities/holiday.entity';

export class UpdateHolidayDto {
    @ApiPropertyOptional({ description: 'Name of the holiday', example: 'Independence Day' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;

    @ApiPropertyOptional({ description: 'Description of the holiday' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Date of the holiday', example: '2026-08-15' })
    @IsOptional()
    @IsDateString()
    date?: string;

    @ApiPropertyOptional({
        description: 'Type of holiday',
        enum: HolidayType,
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
    })
    @IsOptional()
    @IsBoolean()
    isRecurring?: boolean;

    @ApiPropertyOptional({ description: 'Whether the holiday is active' })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ description: 'Organization ID' })
    @IsOptional()
    @IsUUID()
    organizationId?: string;
}