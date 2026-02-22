import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HolidayType } from '../../../database/entities/holiday.entity';

export class HolidayResponseDto {
    @ApiProperty({ description: 'Holiday ID' })
    id: string;

    @ApiProperty({ description: 'Name of the holiday' })
    name: string;

    @ApiPropertyOptional({ description: 'Description of the holiday' })
    description?: string;

    @ApiProperty({ description: 'Date of the holiday' })
    date: Date;

    @ApiProperty({
        description: 'Type of holiday',
        enum: HolidayType,
    })
    type: HolidayType;

    @ApiPropertyOptional({ description: 'Single location for the holiday' })
    location?: string;

    @ApiPropertyOptional({
        description: 'Multiple locations for the holiday',
        type: [String],
    })
    locations?: string[];

    @ApiProperty({ description: 'Whether the holiday recurs every year' })
    isRecurring: boolean;

    @ApiProperty({ description: 'Whether the holiday is active' })
    isActive: boolean;

    @ApiPropertyOptional({ description: 'Organization ID' })
    organizationId?: string;

    @ApiProperty({ description: 'Created at timestamp' })
    createdAt: Date;

    @ApiProperty({ description: 'Updated at timestamp' })
    updatedAt: Date;
}

export class HolidayListResponseDto {
    @ApiProperty({ type: [HolidayResponseDto] })
    data: HolidayResponseDto[];

    @ApiProperty({ description: 'Total count of holidays' })
    total: number;
}