import { IsOptional, IsString } from 'class-validator';

export class EmployeeSearchDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    department?: string;

    @IsOptional()
    @IsString()
    designation?: string;
}