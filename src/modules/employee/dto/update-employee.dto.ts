import {
    IsString,
    IsEmail,
    IsOptional,
    IsEnum,
    IsDateString,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEmployeeDto {
    // ==================== PERSONAL INFORMATION ====================
    @ApiPropertyOptional({ description: 'First name of the employee' })
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiPropertyOptional({ description: 'Last name of the employee' })
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiPropertyOptional({ description: 'Mobile number of the employee' })
    @IsOptional()
    @IsString()
    mobileNumber?: string;

    @ApiPropertyOptional({ description: 'Email address of the employee' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ description: 'Date of birth (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    dateOfBirth?: string;

    @ApiPropertyOptional({ description: 'Marital status' })
    @IsOptional()
    @IsString()
    maritalStatus?: string;

    @ApiPropertyOptional({ description: 'Gender' })
    @IsOptional()
    @IsString()
    gender?: string;

    @ApiPropertyOptional({ description: 'Nationality' })
    @IsOptional()
    @IsString()
    nationality?: string;

    @ApiPropertyOptional({ description: 'City' })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional({ description: 'State' })
    @IsOptional()
    @IsString()
    state?: string;

    @ApiPropertyOptional({ description: 'Zipcode' })
    @IsOptional()
    @IsString()
    zipcode?: string;

    // ==================== PROFESSIONAL INFORMATION ====================
    @ApiPropertyOptional({ description: 'Employee ID' })
    @IsOptional()
    @IsString()
    employeeId?: string;

    @ApiPropertyOptional({ description: 'Username' })
    @IsOptional()
    @IsString()
    username?: string;

    @ApiPropertyOptional({ description: 'Employment type' })
    @IsOptional()
    @IsString()
    employmentType?: string;

    @ApiPropertyOptional({ description: 'Official email address' })
    @IsOptional()
    @IsEmail()
    officialEmail?: string;

    @ApiPropertyOptional({ description: 'Department' })
    @IsOptional()
    @IsString()
    department?: string;

    @ApiPropertyOptional({ description: 'Designation' })
    @IsOptional()
    @IsString()
    designation?: string;

    @ApiPropertyOptional({ description: 'Working days' })
    @IsOptional()
    @IsString()
    workingDays?: string;

    @ApiPropertyOptional({ description: 'Date of joining (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    dateOfJoining?: string;

    @ApiPropertyOptional({ description: 'Office location' })
    @IsOptional()
    @IsString()
    officeLocation?: string;

    @ApiPropertyOptional({ description: 'Reporting manager ID' })
    @IsOptional()
    @IsString()
    reportingManagerId?: string;

    @ApiPropertyOptional({ description: 'Role', enum: Role })
    @IsOptional()
    @IsEnum(Role)
    role?: Role;

    // ==================== DOCUMENTS ====================
    @ApiPropertyOptional({ description: 'Appointment letter URL or base64' })
    @IsOptional()
    @IsString()
    appointmentLetter?: string;

    @ApiPropertyOptional({ description: 'Salary slips URL or base64' })
    @IsOptional()
    @IsString()
    salarySlips?: string;

    @ApiPropertyOptional({ description: 'Relieving letter URL or base64' })
    @IsOptional()
    @IsString()
    relievingLetter?: string;

    @ApiPropertyOptional({ description: 'Experience letter URL or base64' })
    @IsOptional()
    @IsString()
    experienceLetter?: string;

    @ApiPropertyOptional({ description: 'Certificate letter URL or base64' })
    @IsOptional()
    @IsString()
    certificateLetter?: string;

    // ==================== ACCOUNT ACCESS ====================
    @ApiPropertyOptional({ description: 'Slack ID' })
    @IsOptional()
    @IsString()
    slackId?: string;

    @ApiPropertyOptional({ description: 'Skype ID' })
    @IsOptional()
    @IsString()
    skypeId?: string;

    @ApiPropertyOptional({ description: 'GitHub ID' })
    @IsOptional()
    @IsString()
    githubId?: string;
}