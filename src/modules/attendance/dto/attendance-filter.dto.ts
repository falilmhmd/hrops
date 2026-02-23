import { IsOptional, IsString, IsDateString, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '../../../database/entities/attendance.entity';

export class AttendanceFilterDto {
    @ApiPropertyOptional({
        description: 'Filter by department',
        example: 'Engineering',
    })
    @IsOptional()
    @IsString()
    department?: string;

    @ApiPropertyOptional({
        description: 'Filter by user ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsOptional()
    @IsString()
    userId?: string;

    @ApiPropertyOptional({
        description: 'Filter by attendance status',
        enum: AttendanceStatus,
        example: AttendanceStatus.PRESENT,
    })
    @IsOptional()
    @IsEnum(AttendanceStatus)
    status?: AttendanceStatus;

    @ApiPropertyOptional({
        description: 'Start date for date range filter',
        example: '2026-02-01',
    })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({
        description: 'End date for date range filter',
        example: '2026-02-28',
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({
        description: 'Filter by month (1-12)',
        example: 2,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(12)
    month?: number;

    @ApiPropertyOptional({
        description: 'Filter by year',
        example: 2026,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(2020)
    @Max(2100)
    year?: number;

    @ApiPropertyOptional({
        description: 'Page number for pagination',
        example: 1,
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Number of items per page',
        example: 10,
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 10;
}

export class AttendanceSummaryFilterDto {
    @ApiPropertyOptional({
        description: 'Filter by department',
        example: 'Engineering',
    })
    @IsOptional()
    @IsString()
    department?: string;

    @ApiPropertyOptional({
        description: 'Filter by user ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsOptional()
    @IsString()
    userId?: string;

    @ApiPropertyOptional({
        description: 'Month for summary (1-12)',
        example: 2,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(12)
    month?: number;

    @ApiPropertyOptional({
        description: 'Year for summary',
        example: 2026,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(2020)
    @Max(2100)
    year?: number;
}