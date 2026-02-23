import {
    IsString,
    IsUUID,
    IsDateString,
    IsEnum,
    IsOptional,
    IsNumber,
    Min,
    Max,
    IsUrl,
} from 'class-validator';
import { LeaveDuration } from '../../../database/entities/leave-request.entity';

export class CreateLeaveRequestDto {
    @IsUUID()
    leaveTypeId: string;

    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;

    @IsEnum(LeaveDuration)
    @IsOptional()
    startDuration?: LeaveDuration;

    @IsEnum(LeaveDuration)
    @IsOptional()
    endDuration?: LeaveDuration;

    @IsNumber()
    @Min(0.5)
    @Max(30)
    numberOfDays: number;

    @IsString()
    reason: string;

    @IsOptional()
    @IsUrl()
    @IsString()
    attachment?: string;
}