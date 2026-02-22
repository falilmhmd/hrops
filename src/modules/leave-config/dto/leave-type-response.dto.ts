import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';
import { LeaveAccrualType } from '../../../database/entities/leave-type.entity';

export class LeaveTypeResponseDto {
    @ApiProperty({ description: 'Leave type ID' })
    id: string;

    @ApiProperty({ description: 'Name of the leave type' })
    name: string;

    @ApiPropertyOptional({ description: 'Description of the leave type' })
    description?: string;

    @ApiProperty({ description: 'Number of days allocated per year' })
    annualAllocation: number;

    @ApiProperty({ description: 'Whether carry forward is allowed' })
    carryForwardAllowed: boolean;

    @ApiPropertyOptional({ description: 'Maximum days that can be carried forward' })
    maxCarryForwardDays?: number;

    @ApiPropertyOptional({ description: 'Maximum consecutive days allowed' })
    maxConsecutiveDays?: number;

    @ApiProperty({ description: 'Whether approval is required' })
    approvalRequired: boolean;

    @ApiProperty({ description: 'Accrual type', enum: LeaveAccrualType })
    accrualType: LeaveAccrualType;

    @ApiPropertyOptional({
        description: 'Roles applicable for this leave type',
        enum: Role,
        isArray: true,
    })
    applicableRoles?: Role[];

    @ApiProperty({ description: 'Whether this leave type is active' })
    isActive: boolean;

    @ApiProperty({ description: 'Whether this is a system default leave type' })
    isSystemDefault: boolean;

    @ApiProperty({ description: 'Whether this leave type has balance restriction' })
    hasBalanceRestriction: boolean;

    @ApiPropertyOptional({ description: 'Organization ID' })
    organizationId?: string;

    @ApiProperty({ description: 'Created at timestamp' })
    createdAt: Date;

    @ApiProperty({ description: 'Updated at timestamp' })
    updatedAt: Date;
}