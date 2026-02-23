import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus, WorkMode, RegularizationStatus } from '../../../database/entities/attendance.entity';

export class UserInfoDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    firstName: string;

    @ApiProperty()
    lastName: string;

    @ApiProperty()
    email: string;

    @ApiPropertyOptional()
    department?: string | null;

    @ApiPropertyOptional()
    designation?: string | null;

    @ApiPropertyOptional()
    employeeId?: string | null;
}

export class AttendanceResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    userId: string;

    @ApiPropertyOptional({ type: UserInfoDto })
    user?: UserInfoDto;

    @ApiProperty()
    date: Date;

    @ApiPropertyOptional()
    checkInTime?: Date;

    @ApiPropertyOptional()
    checkOutTime?: Date;

    @ApiPropertyOptional()
    checkInLocation?: string | null;

    @ApiPropertyOptional()
    checkOutLocation?: string | null;

    @ApiPropertyOptional({ enum: WorkMode })
    workMode?: WorkMode;

    @ApiProperty({ enum: AttendanceStatus })
    status: AttendanceStatus;

    @ApiPropertyOptional()
    workingHours?: number | null;

    @ApiPropertyOptional()
    overtimeHours?: number | null;

    @ApiProperty()
    isLate: boolean;

    @ApiPropertyOptional()
    lateByMinutes?: number | null;

    @ApiProperty()
    isEarlyCheckout: boolean;

    @ApiPropertyOptional()
    earlyCheckoutByMinutes?: number | null;

    @ApiProperty()
    isRegularized: boolean;

    @ApiPropertyOptional({ enum: RegularizationStatus })
    regularizationStatus?: RegularizationStatus;

    @ApiPropertyOptional()
    regularizationReason?: string;

    @ApiPropertyOptional()
    regularizedBy?: string;

    @ApiPropertyOptional({ type: UserInfoDto })
    regularizer?: UserInfoDto;

    @ApiPropertyOptional()
    regularizedAt?: Date;

    @ApiPropertyOptional()
    regularizationComments?: string | null;

    @ApiPropertyOptional()
    notes?: string | null;

    @ApiPropertyOptional()
    organizationId?: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

export class AttendanceListResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    userId: string;

    @ApiPropertyOptional({ type: UserInfoDto })
    user?: UserInfoDto;

    @ApiProperty()
    date: Date;

    @ApiPropertyOptional()
    checkInTime?: Date;

    @ApiPropertyOptional()
    checkOutTime?: Date;

    @ApiProperty({ enum: AttendanceStatus })
    status: AttendanceStatus;

    @ApiPropertyOptional()
    workingHours?: number | null;

    @ApiProperty()
    isLate: boolean;

    @ApiProperty()
    isRegularized: boolean;

    @ApiProperty()
    createdAt: Date;
}

export class AttendanceSummaryDto {
    @ApiProperty()
    totalDays: number;

    @ApiProperty()
    presentDays: number;

    @ApiProperty()
    absentDays: number;

    @ApiProperty()
    lateDays: number;

    @ApiProperty()
    halfDays: number;

    @ApiProperty()
    onLeaveDays: number;

    @ApiProperty()
    holidayDays: number;

    @ApiProperty()
    weekendDays: number;

    @ApiProperty()
    totalWorkingHours: number;

    @ApiProperty()
    averageWorkingHours: number;

    @ApiProperty()
    totalOvertimeHours: number;

    @ApiProperty()
    latePercentage: number;

    @ApiProperty()
    attendancePercentage: number;
}

export class UserAttendanceSummaryDto {
    @ApiProperty()
    userId: string;

    @ApiPropertyOptional({ type: UserInfoDto })
    user?: UserInfoDto;

    @ApiProperty({ type: AttendanceSummaryDto })
    summary: AttendanceSummaryDto;
}

export class DepartmentAttendanceSummaryDto {
    @ApiProperty()
    department: string;

    @ApiProperty()
    totalEmployees: number;

    @ApiProperty()
    presentToday: number;

    @ApiProperty()
    absentToday: number;

    @ApiProperty()
    lateToday: number;

    @ApiProperty()
    onLeaveToday: number;

    @ApiProperty()
    attendancePercentage: number;
}

export class PaginatedAttendanceResponseDto {
    @ApiProperty({ type: [AttendanceListResponseDto] })
    data: AttendanceListResponseDto[];

    @ApiProperty()
    total: number;

    @ApiProperty()
    page: number;

    @ApiProperty()
    limit: number;

    @ApiProperty()
    totalPages: number;
}

export class TodayAttendanceStatusDto {
    @ApiProperty()
    isCheckedIn: boolean;

    @ApiProperty()
    isCheckedOut: boolean;

    @ApiPropertyOptional()
    checkInTime?: Date;

    @ApiPropertyOptional()
    checkOutTime?: Date;

    @ApiPropertyOptional()
    workingHours?: number;

    @ApiPropertyOptional({ enum: WorkMode })
    workMode?: WorkMode;

    @ApiProperty({ enum: AttendanceStatus })
    status: AttendanceStatus;

    @ApiProperty()
    isLate: boolean;
}