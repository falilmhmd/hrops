import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';

export class EmployeeResponseDto {
    // ==================== PERSONAL INFORMATION ====================
    @ApiProperty()
    id: string;

    @ApiProperty()
    firstName: string;

    @ApiProperty()
    lastName: string;

    @ApiPropertyOptional()
    mobileNumber?: string;

    @ApiProperty()
    email: string;

    @ApiPropertyOptional()
    dateOfBirth?: Date;

    @ApiPropertyOptional()
    maritalStatus?: string;

    @ApiPropertyOptional()
    gender?: string;

    @ApiPropertyOptional()
    nationality?: string;

    @ApiPropertyOptional()
    city?: string;

    @ApiPropertyOptional()
    state?: string;

    @ApiPropertyOptional()
    zipcode?: string;

    // ==================== PROFESSIONAL INFORMATION ====================
    @ApiPropertyOptional()
    employeeId?: string;

    @ApiPropertyOptional()
    username?: string;

    @ApiPropertyOptional()
    employmentType?: string;

    @ApiPropertyOptional()
    officialEmail?: string;

    @ApiPropertyOptional()
    department?: string;

    @ApiPropertyOptional()
    designation?: string;

    @ApiPropertyOptional()
    workingDays?: string;

    @ApiPropertyOptional()
    dateOfJoining?: Date;

    @ApiPropertyOptional()
    officeLocation?: string;

    @ApiPropertyOptional()
    reportingManagerId?: string;

    @ApiPropertyOptional({ enum: Role })
    role?: Role;

    // ==================== DOCUMENTS ====================
    @ApiPropertyOptional()
    appointmentLetter?: string;

    @ApiPropertyOptional()
    salarySlips?: string;

    @ApiPropertyOptional()
    relievingLetter?: string;

    @ApiPropertyOptional()
    experienceLetter?: string;

    @ApiPropertyOptional()
    certificateLetter?: string;

    // ==================== ACCOUNT ACCESS ====================
    @ApiPropertyOptional()
    slackId?: string;

    @ApiPropertyOptional()
    skypeId?: string;

    @ApiPropertyOptional()
    githubId?: string;

    // ==================== SYSTEM FIELDS ====================
    @ApiProperty()
    isActive: boolean;

    @ApiProperty()
    isDeleted: boolean;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}