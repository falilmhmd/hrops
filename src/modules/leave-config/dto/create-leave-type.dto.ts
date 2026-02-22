import {
    IsString,
    IsInt,
    IsBoolean,
    IsOptional,
    IsEnum,
    IsArray,
    Min,
    Max,
    IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';
import { LeaveAccrualType } from '../../../database/entities/leave-type.entity';

export class CreateLeaveTypeDto {
    @ApiProperty({ description: 'Name of the leave type', example: 'Casual Leave' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ description: 'Description of the leave type' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Number of days allocated per year', example: 12 })
    @IsInt()
    @Min(0)
    annualAllocation: number;

    @ApiPropertyOptional({ description: 'Whether carry forward is allowed', default: false })
    @IsOptional()
    @IsBoolean()
    carryForwardAllowed?: boolean;

    @ApiPropertyOptional({ description: 'Maximum days that can be carried forward' })
    @IsOptional()
    @IsInt()
    @Min(0)
    maxCarryForwardDays?: number;

    @ApiPropertyOptional({ description: 'Maximum consecutive days allowed' })
    @IsOptional()
    @IsInt()
    @Min(1)
    maxConsecutiveDays?: number;

    @ApiPropertyOptional({ description: 'Whether approval is required', default: true })
    @IsOptional()
    @IsBoolean()
    approvalRequired?: boolean;

    @ApiPropertyOptional({
        description: 'Accrual type - monthly or yearly',
        enum: LeaveAccrualType,
        default: LeaveAccrualType.YEARLY,
    })
    @IsOptional()
    @IsEnum(LeaveAccrualType)
    accrualType?: LeaveAccrualType;

    @ApiPropertyOptional({
        description: 'Roles applicable for this leave type',
        enum: Role,
        isArray: true,
        default: [Role.EMPLOYEE, Role.REPORTING_MANAGER, Role.HR_ADMIN],
    })
    @IsOptional()
    @IsArray()
    @IsEnum(Role, { each: true })
    applicableRoles?: Role[];

    @ApiPropertyOptional({ description: 'Whether this leave type has balance restriction', default: true })
    @IsOptional()
    @IsBoolean()
    hasBalanceRestriction?: boolean;

    @ApiPropertyOptional({ description: 'Organization ID' })
    @IsOptional()
    @IsUUID()
    organizationId?: string;
}