import {
    Controller,
    Post,
    Put,
    Delete,
    Get,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { LeaveConfigService } from './leave-config.service';
import {
    CreateLeaveTypeDto,
    UpdateLeaveTypeDto,
    LeaveTypeResponseDto,
    LeaveBalanceResponseDto,
    AssignLeaveTypeDto,
    BulkAssignLeaveTypesDto,
} from './dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Leave Configuration')
@Controller('leave-config')
@Roles(Role.HR_ADMIN, Role.SUPER_ADMIN)
export class LeaveConfigController {
    constructor(private readonly leaveConfigService: LeaveConfigService) { }

    // ==================== LEAVE TYPE ENDPOINTS ====================

    @Post('leave-types')
    @ApiOperation({ summary: 'Create a new leave type' })
    @ApiResponse({ status: 201, description: 'Leave type created successfully', type: LeaveTypeResponseDto })
    async createLeaveType(@Body() createDto: CreateLeaveTypeDto): Promise<LeaveTypeResponseDto> {
        return this.leaveConfigService.createLeaveType(createDto);
    }

    @Put('leave-types/:id')
    @ApiOperation({ summary: 'Update an existing leave type' })
    @ApiParam({ name: 'id', description: 'Leave type ID' })
    @ApiResponse({ status: 200, description: 'Leave type updated successfully', type: LeaveTypeResponseDto })
    async updateLeaveType(
        @Param('id') id: string,
        @Body() updateDto: UpdateLeaveTypeDto,
    ): Promise<LeaveTypeResponseDto> {
        return this.leaveConfigService.updateLeaveType(id, updateDto);
    }

    @Delete('leave-types/:id')
    @ApiOperation({ summary: 'Delete a leave type (soft delete)' })
    @ApiParam({ name: 'id', description: 'Leave type ID' })
    @ApiResponse({ status: 204, description: 'Leave type deleted successfully' })
    async deleteLeaveType(@Param('id') id: string): Promise<void> {
        return this.leaveConfigService.deleteLeaveType(id);
    }

    @Get('leave-types')
    @ApiOperation({ summary: 'Get all leave types' })
    @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
    @ApiResponse({ status: 200, description: 'Leave types retrieved successfully', type: [LeaveTypeResponseDto] })
    async findAllLeaveTypes(
        @Query('includeInactive') includeInactive?: boolean,
    ): Promise<LeaveTypeResponseDto[]> {
        return this.leaveConfigService.findAllLeaveTypes(includeInactive);
    }

    @Get('leave-types/:id')
    @ApiOperation({ summary: 'Get leave type by ID' })
    @ApiParam({ name: 'id', description: 'Leave type ID' })
    @ApiResponse({ status: 200, description: 'Leave type retrieved successfully', type: LeaveTypeResponseDto })
    async findLeaveTypeById(@Param('id') id: string): Promise<LeaveTypeResponseDto> {
        return this.leaveConfigService.findLeaveTypeById(id);
    }

    @Get('leave-types/by-role/:role')
    @ApiOperation({ summary: 'Get leave types applicable to a specific role' })
    @ApiParam({ name: 'role', enum: Role })
    @ApiResponse({ status: 200, description: 'Leave types retrieved successfully', type: [LeaveTypeResponseDto] })
    async findLeaveTypesByRole(@Param('role') role: Role): Promise<LeaveTypeResponseDto[]> {
        return this.leaveConfigService.findLeaveTypesByRole(role);
    }

    // ==================== LEAVE BALANCE ENDPOINTS ====================

    @Post('leave-types/:leaveTypeId/assign')
    @ApiOperation({ summary: 'Assign a leave type to multiple users' })
    @ApiParam({ name: 'leaveTypeId', description: 'Leave type ID' })
    @ApiResponse({ status: 201, description: 'Leave type assigned successfully', type: [LeaveBalanceResponseDto] })
    async assignLeaveTypeToUsers(
        @Param('leaveTypeId') leaveTypeId: string,
        @Body() assignDto: AssignLeaveTypeDto,
    ): Promise<LeaveBalanceResponseDto[]> {
        return this.leaveConfigService.assignLeaveTypeToUsers(leaveTypeId, assignDto);
    }

    @Post('leave-types/bulk-assign')
    @ApiOperation({ summary: 'Bulk assign multiple leave types to multiple users' })
    @ApiResponse({ status: 201, description: 'Leave types assigned successfully', type: [LeaveBalanceResponseDto] })
    async bulkAssignLeaveTypes(@Body() assignDto: BulkAssignLeaveTypesDto): Promise<LeaveBalanceResponseDto[]> {
        return this.leaveConfigService.bulkAssignLeaveTypes(assignDto);
    }

    @Get('balances/user/:userId')
    @ApiOperation({ summary: 'Get leave balances for a user' })
    @ApiParam({ name: 'userId', description: 'User ID' })
    @ApiQuery({ name: 'year', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Leave balances retrieved successfully', type: [LeaveBalanceResponseDto] })
    @Roles(Role.HR_ADMIN, Role.SUPER_ADMIN, Role.REPORTING_MANAGER)
    async getUserLeaveBalances(
        @Param('userId') userId: string,
        @Query('year') year?: number,
    ): Promise<LeaveBalanceResponseDto[]> {
        return this.leaveConfigService.getUserLeaveBalances(userId, year);
    }

    @Get('balances/my')
    @ApiOperation({ summary: 'Get current user leave balances' })
    @ApiQuery({ name: 'year', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Leave balances retrieved successfully', type: [LeaveBalanceResponseDto] })
    @Roles(Role.EMPLOYEE, Role.REPORTING_MANAGER, Role.HR_ADMIN, Role.SUPER_ADMIN)
    async getMyLeaveBalances(
        @CurrentUser('id') userId: string,
        @Query('year') year?: number,
    ): Promise<LeaveBalanceResponseDto[]> {
        return this.leaveConfigService.getUserLeaveBalances(userId, year);
    }

    @Get('balances/user/:userId/leave-type/:leaveTypeId')
    @ApiOperation({ summary: 'Get leave balance for a specific user and leave type' })
    @ApiParam({ name: 'userId', description: 'User ID' })
    @ApiParam({ name: 'leaveTypeId', description: 'Leave type ID' })
    @ApiQuery({ name: 'year', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Leave balance retrieved successfully', type: LeaveBalanceResponseDto })
    @Roles(Role.HR_ADMIN, Role.SUPER_ADMIN, Role.REPORTING_MANAGER)
    async getUserLeaveBalanceByType(
        @Param('userId') userId: string,
        @Param('leaveTypeId') leaveTypeId: string,
        @Query('year') year?: number,
    ): Promise<LeaveBalanceResponseDto> {
        return this.leaveConfigService.getUserLeaveBalanceByType(userId, leaveTypeId, year);
    }

    // ==================== SYSTEM DEFAULT LEAVE TYPES ====================

    @Post('default-leave-types')
    @ApiOperation({ summary: 'Create default leave types (Casual, Medical, LOP, Optional)' })
    @ApiQuery({ name: 'organizationId', required: false, type: String })
    @ApiResponse({ status: 201, description: 'Default leave types created successfully', type: [LeaveTypeResponseDto] })
    async createDefaultLeaveTypes(
        @Query('organizationId') organizationId?: string,
    ): Promise<LeaveTypeResponseDto[]> {
        return this.leaveConfigService.createDefaultLeaveTypes(organizationId);
    }

    // ==================== LEAVE ACCRUAL ENDPOINTS ====================

    @Post('accrual/monthly')
    @ApiOperation({ summary: 'Process monthly leave accrual (BR-LEAVE-001)' })
    @ApiResponse({ status: 200, description: 'Monthly accrual processed successfully' })
    async processMonthlyAccrual(): Promise<{ message: string }> {
        await this.leaveConfigService.processMonthlyAccrual();
        return { message: 'Monthly accrual processed successfully' };
    }

    @Post('accrual/year-end-carry-forward')
    @ApiOperation({ summary: 'Process year-end carry forward (BR-LEAVE-003)' })
    @ApiResponse({ status: 200, description: 'Year-end carry forward processed successfully' })
    async processYearEndCarryForward(): Promise<{ message: string }> {
        await this.leaveConfigService.processYearEndCarryForward();
        return { message: 'Year-end carry forward processed successfully' };
    }
}