import {
    IsString,
    IsDateString,
    IsEnum,
    IsOptional,
    IsNumber,
    Min,
    Max,
    IsUrl,
} from 'class-validator';
import { LeaveDuration } from '../../../database/entities/leave-request.entity';

export class UpdateLeaveRequestDto {
    @IsDateString()
    @IsOptional()
    startDate?: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;

    @IsEnum(LeaveDuration)
    @IsOptional()
    startDuration?: LeaveDuration;

    @IsEnum(LeaveDuration)
    @IsOptional()
    endDuration?: LeaveDuration;

    @IsNumber()
    @Min(0.5)
    @Max(30)
    @IsOptional()
    numberOfDays?: number;

    @IsString()
    @IsOptional()
    reason?: string;

    @IsOptional()
    @IsUrl()
    @IsString()
    attachment?: string;
}