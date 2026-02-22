import {
    IsString,
    IsEmail,
    IsOptional,
    IsEnum,
    IsDate,
    IsDateString,
    IsPhoneNumber,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
    // ==================== PERSONAL INFORMATION ====================
    @ApiProperty({ description: 'First name of the employee' })
    @IsString()
    firstName: string;

    @ApiProperty({ description: 'Last name of the employee' })
    @IsString()
    lastName: string;

    @ApiPropertyOptional({ description: 'Mobile number of the employee' })
    @IsOptional()
    @IsString()
    mobileNumber?: string;

    @ApiProperty({ description: 'Email address of the employee' })
    @IsEmail()
    email: string;

    @ApiPropertyOptional({ description: 'Date of birth (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    dateOfBirth?: string;

    @ApiPropertyOptional({ description: 'Marital status (Single, Married, etc.)' })
    @IsOptional()
    @IsString()
    maritalStatus?: string;

    @ApiPropertyOptional({ description: 'Gender (Male, Female, Other)' })
    @IsOptional()
    @IsString()
    gender?: string;

    @ApiPropertyOptional({ description: 'Nationality of the employee' })
    @IsOptional()
    @IsString()
    nationality?: string;

    // Address fields
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
    @ApiPropertyOptional({ description: 'Employee ID (auto or manual)' })
    @IsOptional()
    @IsString()
    employeeId?: string;

    @ApiPropertyOptional({ description: 'Username for login' })
    @IsOptional()
    @IsString()
    username?: string;

    @ApiPropertyOptional({ description: 'Employment type (Full-time, Part-time, Contract)' })
    @IsOptional()
    @IsString()
    employmentType?: string;

    @ApiPropertyOptional({ description: 'Official email address' })
    @IsOptional()
    @IsEmail()
    officialEmail?: string;

    @ApiPropertyOptional({ description: 'Department name' })
    @IsOptional()
    @IsString()
    department?: string;

    @ApiPropertyOptional({ description: 'Designation/Job title' })
    @IsOptional()
    @IsString()
    designation?: string;

    @ApiPropertyOptional({ description: 'Working days (e.g., Mon-Fri)' })
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