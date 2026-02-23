import { IsOptional, IsEnum, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { WorkMode } from '../../../database/entities/attendance.entity';

export class CheckInDto {
    @ApiPropertyOptional({
        description: 'Work mode for the day',
        enum: WorkMode,
        example: WorkMode.WFO,
    })
    @IsOptional()
    @IsEnum(WorkMode)
    workMode?: WorkMode;

    @ApiPropertyOptional({
        description: 'Check-in location name',
        example: 'Main Office',
    })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiPropertyOptional({
        description: 'Check-in latitude',
        example: 28.6139,
    })
    @IsOptional()
    @IsNumber()
    latitude?: number;

    @ApiPropertyOptional({
        description: 'Check-in longitude',
        example: 77.209,
    })
    @IsOptional()
    @IsNumber()
    longitude?: number;

    @ApiPropertyOptional({
        description: 'Additional notes',
        example: 'Working on Project X',
    })
    @IsOptional()
    @IsString()
    notes?: string;
}