import { IsOptional, IsEnum } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class EmployeeFilterDto {
    @IsOptional()
    @IsEnum(Role)
    role?: Role;

    @IsOptional()
    @IsEnum(Role, { each: true })
    roles?: Role[];

    @IsOptional()
    department?: string;

    @IsOptional()
    employmentType?: string;

    @IsOptional()
    isActive?: boolean;

    @IsOptional()
    isDeleted?: boolean;
}