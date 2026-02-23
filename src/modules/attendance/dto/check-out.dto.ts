import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CheckOutDto {
    @ApiPropertyOptional({
        description: 'Check-out location name',
        example: 'Main Office',
    })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiPropertyOptional({
        description: 'Check-out latitude',
        example: 28.6139,
    })
    @IsOptional()
    @IsNumber()
    latitude?: number;

    @ApiPropertyOptional({
        description: 'Check-out longitude',
        example: 77.209,
    })
    @IsOptional()
    @IsNumber()
    longitude?: number;

    @ApiPropertyOptional({
        description: 'Additional notes',
        example: 'Completed tasks for today',
    })
    @IsOptional()
    @IsString()
    notes?: string;
}