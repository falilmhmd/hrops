import { IsArray, IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignLeaveTypeDto {
    @ApiProperty({ description: 'Array of user IDs to assign leave type to', type: [String] })
    @IsArray()
    @IsUUID('4', { each: true })
    userIds: string[];

    @ApiPropertyOptional({ description: 'Organization ID' })
    @IsOptional()
    @IsUUID()
    organizationId?: string;
}

export class BulkAssignLeaveTypesDto {
    @ApiProperty({ description: 'Array of user IDs', type: [String] })
    @IsArray()
    @IsUUID('4', { each: true })
    userIds: string[];

    @ApiProperty({ description: 'Array of leave type IDs to assign', type: [String] })
    @IsArray()
    @IsUUID('4', { each: true })
    leaveTypeIds: string[];

    @ApiPropertyOptional({ description: 'Organization ID' })
    @IsOptional()
    @IsUUID()
    organizationId?: string;
}