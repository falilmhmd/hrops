import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    ParseUUIDPipe,
} from '@nestjs/common';
import { LeaveRequestService } from './leave-request.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { LeaveRequestStatus } from '../../database/entities/leave-request.entity';
import {
    CreateLeaveRequestDto,
    UpdateLeaveRequestDto,
    ApproveLeaveRequestDto,
    RejectLeaveRequestDto,
    RequestModificationDto,
} from './dto';

@Controller('leave-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveRequestController {
    constructor(private readonly leaveRequestService: LeaveRequestService) { }

    // ==================== EMPLOYEE ENDPOINTS ====================

    /**
     * Create a new leave request (Employee)
     * FR-EMP-LEAVE-001: Apply Leave
     */
    @Post()
    @Roles(Role.EMPLOYEE, Role.REPORTING_MANAGER, Role.HR_ADMIN, Role.SUPER_ADMIN)
    async createLeaveRequest(
        @CurrentUser('id') userId: string,
        @Body() createDto: CreateLeaveRequestDto,
    ) {
        return this.leaveRequestService.createLeaveRequest(userId, createDto);
    }

    /**
     * Get current user's leave requests
     * FR-EMP-LEAVE-002: Leave History & Balance
     */
    @Get('my-requests')
    @Roles(Role.EMPLOYEE, Role.REPORTING_MANAGER, Role.HR_ADMIN, Role.SUPER_ADMIN)
    async getMyLeaveRequests(
        @CurrentUser('id') userId: string,
        @Query('status') status?: LeaveRequestStatus,
        @Query('year') year?: number,
    ) {
        return this.leaveRequestService.getUserLeaveRequests(userId, status, year ? +year : undefined);
    }

    /**
     * Get current user's leave balance summary
     * FR-EMP-LEAVE-002: Leave History & Balance
     */
    @Get('my-balance')
    @Roles(Role.EMPLOYEE, Role.REPORTING_MANAGER, Role.HR_ADMIN, Role.SUPER_ADMIN)
    async getMyLeaveBalance(@CurrentUser('id') userId: string) {
        return this.leaveRequestService.getUserLeaveBalanceSummary(userId);
    }

    /**
     * Get a specific leave request by ID
     */
    @Get(':id')
    @Roles(Role.EMPLOYEE, Role.REPORTING_MANAGER, Role.HR_ADMIN, Role.SUPER_ADMIN)
    async getLeaveRequestById(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.leaveRequestService.getLeaveRequestById(id, userId);
    }

    /**
     * Update a leave request (Employee - only pending or modification_requested)
     */
    @Put(':id')
    @Roles(Role.EMPLOYEE, Role.REPORTING_MANAGER, Role.HR_ADMIN, Role.SUPER_ADMIN)
    async updateLeaveRequest(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('id') userId: string,
        @Body() updateDto: UpdateLeaveRequestDto,
    ) {
        return this.leaveRequestService.updateLeaveRequest(id, userId, updateDto);
    }

    /**
     * Cancel a leave request (Employee)
     */
    @Patch(':id/cancel')
    @Roles(Role.EMPLOYEE, Role.REPORTING_MANAGER, Role.HR_ADMIN, Role.SUPER_ADMIN)
    async cancelLeaveRequest(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('id') userId: string,
        @Body('cancellationReason') cancellationReason?: string,
    ) {
        return this.leaveRequestService.cancelLeaveRequest(id, userId, cancellationReason);
    }

    // ==================== APPROVER ENDPOINTS ====================

    /**
     * Get pending approvals for current approver
     * FR-ADMIN-LEAVE-MGMT-001: Leave Approval
     */
    @Get('pending-approvals')
    @Roles(Role.REPORTING_MANAGER, Role.HR_ADMIN, Role.SUPER_ADMIN)
    async getPendingApprovals(@CurrentUser('id') approverId: string) {
        return this.leaveRequestService.getPendingApprovals(approverId);
    }

    /**
     * Approve a leave request
     * FR-ADMIN-LEAVE-MGMT-001: Leave Approval
     * BR-LEAVE-004: Leave deducted only after approval
     */
    @Patch(':id/approve')
    @Roles(Role.REPORTING_MANAGER, Role.HR_ADMIN, Role.SUPER_ADMIN)
    async approveLeaveRequest(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('id') approverId: string,
        @Body() approveDto: ApproveLeaveRequestDto,
    ) {
        return this.leaveRequestService.approveLeaveRequest(id, approverId, approveDto);
    }

    /**
     * Reject a leave request
     * FR-ADMIN-LEAVE-MGMT-001: Leave Approval
     * BR-LEAVE-005: Rejected leave restores balance
     */
    @Patch(':id/reject')
    @Roles(Role.REPORTING_MANAGER, Role.HR_ADMIN, Role.SUPER_ADMIN)
    async rejectLeaveRequest(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('id') approverId: string,
        @Body() rejectDto: RejectLeaveRequestDto,
    ) {
        return this.leaveRequestService.rejectLeaveRequest(id, approverId, rejectDto);
    }

    /**
     * Request modification for a leave request
     * FR-ADMIN-LEAVE-MGMT-001: Leave Approval
     */
    @Patch(':id/request-modification')
    @Roles(Role.REPORTING_MANAGER, Role.HR_ADMIN, Role.SUPER_ADMIN)
    async requestModification(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('id') approverId: string,
        @Body() modificationDto: RequestModificationDto,
    ) {
        return this.leaveRequestService.requestModification(id, approverId, modificationDto);
    }

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * Get all leave requests (Admin only)
     * FR-ADMIN-LEAVE-MGMT-001: Leave Approval
     */
    @Get()
    @Roles(Role.HR_ADMIN, Role.SUPER_ADMIN)
    async getAllLeaveRequests(
        @Query('status') status?: LeaveRequestStatus,
        @Query('department') department?: string,
        @Query('year') year?: number,
    ) {
        return this.leaveRequestService.getAllLeaveRequests(
            status,
            department,
            year ? +year : undefined,
        );
    }

    /**
     * Get leave balance summary for a specific user (Admin only)
     */
    @Get('user/:userId/balance')
    @Roles(Role.HR_ADMIN, Role.SUPER_ADMIN)
    async getUserLeaveBalance(@Param('userId', ParseUUIDPipe) userId: string) {
        return this.leaveRequestService.getUserLeaveBalanceSummary(userId);
    }

    /**
     * Get leave requests for a specific user (Admin only)
     */
    @Get('user/:userId')
    @Roles(Role.HR_ADMIN, Role.SUPER_ADMIN)
    async getUserLeaveRequests(
        @Param('userId', ParseUUIDPipe) userId: string,
        @Query('status') status?: LeaveRequestStatus,
        @Query('year') year?: number,
    ) {
        return this.leaveRequestService.getUserLeaveRequests(
            userId,
            status,
            year ? +year : undefined,
        );
    }
}