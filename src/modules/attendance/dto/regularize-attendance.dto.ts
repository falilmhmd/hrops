import { IsNotEmpty, IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '../../../database/entities/attendance.entity';

export class RegularizeAttendanceDto {
    @ApiProperty({
        description: 'User ID for attendance regularization',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty()
    @IsString()
    userId: string;

    @ApiProperty({
        description: 'Date for attendance regularization',
        example: '2026-02-20',
    })
    @IsNotEmpty()
    @IsDateString()
    date: string;

    @ApiProperty({
        description: 'Reason for regularization',
        example: 'Forgot to check in due to system issues',
    })
    @IsNotEmpty()
    @IsString()
    reason: string;

    @ApiPropertyOptional({
        description: 'Attendance status to set',
        enum: AttendanceStatus,
        example: AttendanceStatus.PRESENT,
    })
    @IsOptional()
    @IsEnum(AttendanceStatus)
    status?: AttendanceStatus;

    @ApiPropertyOptional({
        description: 'Check-in time (ISO string)',
        example: '2026-02-20T09:00:00.000Z',
    })
    @IsOptional()
    @IsDateString()
    checkInTime?: string;

    @ApiPropertyOptional({
        description: 'Check-out time (ISO string)',
        example: '2026-02-20T18:00:00.000Z',
    })
    @IsOptional()
    @IsDateString()
    checkOutTime?: string;

    @ApiPropertyOptional({
        description: 'Additional comments from admin',
        example: 'Approved after verification',
    })
    @IsOptional()
    @IsString()
    comments?: string;
}

export class ApproveRegularizationDto {
    @ApiPropertyOptional({
        description: 'Admin comments for approval',
        example: 'Verified and approved',
    })
    @IsOptional()
    @IsString()
    comments?: string;
}

export class RejectRegularizationDto {
    @ApiProperty({
        description: 'Reason for rejecting regularization request',
        example: 'Insufficient justification',
    })
    @IsNotEmpty()
    @IsString()
    rejectionReason: string;
}