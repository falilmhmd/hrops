import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveTypeResponseDto } from './leave-type-response.dto';

export class LeaveBalanceResponseDto {
    @ApiProperty({ description: 'Leave balance ID' })
    id: string;

    @ApiProperty({ description: 'User ID' })
    userId: string;

    @ApiProperty({ description: 'Leave type ID' })
    leaveTypeId: string;

    @ApiPropertyOptional({ description: 'Leave type details', type: LeaveTypeResponseDto })
    leaveType?: LeaveTypeResponseDto;

    @ApiProperty({ description: 'Total allocated days' })
    totalAllocated: number;

    @ApiProperty({ description: 'Used days' })
    usedDays: number;

    @ApiProperty({ description: 'Pending days (awaiting approval)' })
    pendingDays: number;

    @ApiProperty({ description: 'Days carried forward from previous year' })
    carriedForwardDays: number;

    @ApiProperty({ description: 'Remaining days' })
    remainingDays: number;

    @ApiProperty({ description: 'Available balance (calculated)' })
    availableBalance: number;

    @ApiProperty({ description: 'Year' })
    year: number;

    @ApiPropertyOptional({ description: 'Organization ID' })
    organizationId?: string;

    @ApiProperty({ description: 'Created at timestamp' })
    createdAt: Date;

    @ApiProperty({ description: 'Updated at timestamp' })
    updatedAt: Date;
}