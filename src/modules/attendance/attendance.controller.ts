import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import {
    CheckInDto,
    CheckOutDto,
    RegularizeAttendanceDto,
    ApproveRegularizationDto,
    RejectRegularizationDto,
    AttendanceFilterDto,
    AttendanceSummaryFilterDto,
    AttendanceResponseDto,
    PaginatedAttendanceResponseDto,
    TodayAttendanceStatusDto,
    UserAttendanceSummaryDto,
    DepartmentAttendanceSummaryDto,
    AttendanceListResponseDto,
} from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
    constructor(private readonly attendanceService: AttendanceService) { }

    // ==================== EMPLOYEE ENDPOINTS ====================

    @Post('check-in')
    @ApiOperation({ summary: 'Check in for today' })
    @ApiResponse({ status: 201, description: 'Check-in successful', type: AttendanceResponseDto })
    @ApiResponse({ status: 400, description: 'Already checked in' })
    async checkIn(
        @CurrentUser('id') userId: string,
        @Body() checkInDto: CheckInDto,
    ): Promise<AttendanceResponseDto> {
        return this.attendanceService.checkIn(userId, checkInDto);
    }

    @Post('check-out')
    @ApiOperation({ summary: 'Check out for today' })
    @ApiResponse({ status: 200, description: 'Check-out successful', type: AttendanceResponseDto })
    @ApiResponse({ status: 400, description: 'Must check in first or already checked out' })
    async checkOut(
        @CurrentUser('id') userId: string,
        @Body() checkOutDto: CheckOutDto,
    ): Promise<AttendanceResponseDto> {
        return this.attendanceService.checkOut(userId, checkOutDto);
    }

    @Get('today')
    @ApiOperation({ summary: "Get today's attendance status" })
    @ApiResponse({ status: 200, description: 'Today attendance status', type: TodayAttendanceStatusDto })
    async getTodayStatus(
        @CurrentUser('id') userId: string,
    ): Promise<TodayAttendanceStatusDto> {
        return this.attendanceService.getTodayStatus(userId);
    }

    @Get('my-history')
    @ApiOperation({ summary: 'Get my attendance history' })
    @ApiResponse({ status: 200, description: 'Attendance history', type: PaginatedAttendanceResponseDto })
    async getMyAttendanceHistory(
        @CurrentUser('id') userId: string,
        @Query() filterDto: AttendanceFilterDto,
    ): Promise<PaginatedAttendanceResponseDto> {
        return this.attendanceService.getUserAttendanceHistory(userId, filterDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get attendance record by ID' })
    @ApiParam({ name: 'id', description: 'Attendance ID' })
    @ApiResponse({ status: 200, description: 'Attendance record', type: AttendanceResponseDto })
    @ApiResponse({ status: 404, description: 'Attendance not found' })
    async getAttendanceById(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('id') userId: string,
    ): Promise<AttendanceResponseDto> {
        return this.attendanceService.getAttendanceById(id, userId);
    }

    // ==================== ADMIN ENDPOINTS ====================

    @Get()
    @Roles(Role.HR_ADMIN, Role.SUPER_ADMIN, Role.REPORTING_MANAGER)
    @ApiOperation({ summary: 'Get all attendance records (Admin)' })
    @ApiResponse({ status: 200, description: 'List of attendance records', type: PaginatedAttendanceResponseDto })
    async getAllAttendance(
        @Query() filterDto: AttendanceFilterDto,
    ): Promise<PaginatedAttendanceResponseDto> {
        return this.attendanceService.getAllAttendance(filterDto);
    }

    @Get('summary/user')
    @Roles(Role.HR_ADMIN, Role.SUPER_ADMIN, Role.REPORTING_MANAGER)
    @ApiOperation({ summary: 'Get attendance summary by user (Admin)' })
    @ApiResponse({ status: 200, description: 'User attendance summary', type: [UserAttendanceSummaryDto] })
    async getAttendanceSummary(
        @Query() filterDto: AttendanceSummaryFilterDto,
    ): Promise<UserAttendanceSummaryDto[]> {
        return this.attendanceService.getAttendanceSummary(filterDto);
    }

    @Get('summary/department')
    @Roles(Role.HR_ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get attendance summary by department (Admin)' })
    @ApiResponse({ status: 200, description: 'Department attendance summary', type: [DepartmentAttendanceSummaryDto] })
    async getDepartmentAttendanceSummary(): Promise<DepartmentAttendanceSummaryDto[]> {
        return this.attendanceService.getDepartmentAttendanceSummary();
    }

    // ==================== REGULARIZATION ENDPOINTS ====================

    @Post('regularize')
    @Roles(Role.HR_ADMIN, Role.SUPER_ADMIN, Role.REPORTING_MANAGER)
    @ApiOperation({ summary: 'Regularize attendance (Admin)' })
    @ApiResponse({ status: 201, description: 'Attendance regularized', type: AttendanceResponseDto })
    @ApiResponse({ status: 400, description: 'Invalid date or already regularized' })
    @ApiResponse({ status: 403, description: 'Not authorized to regularize' })
    async regularizeAttendance(
        @CurrentUser('id') adminId: string,
        @Body() regularizeDto: RegularizeAttendanceDto,
    ): Promise<AttendanceResponseDto> {
        return this.attendanceService.requestRegularization(adminId, regularizeDto);
    }

    @Get('regularizations/pending')
    @Roles(Role.HR_ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get pending regularization requests (Admin)' })
    @ApiResponse({ status: 200, description: 'List of pending regularizations', type: [AttendanceListResponseDto] })
    async getPendingRegularizations(): Promise<AttendanceListResponseDto[]> {
        return this.attendanceService.getPendingRegularizations();
    }

    @Patch('regularizations/:id/approve')
    @Roles(Role.HR_ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Approve regularization request (Admin)' })
    @ApiParam({ name: 'id', description: 'Attendance ID' })
    @ApiResponse({ status: 200, description: 'Regularization approved', type: AttendanceResponseDto })
    @ApiResponse({ status: 400, description: 'Only pending regularizations can be approved' })
    async approveRegularization(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('id') adminId: string,
        @Body() approveDto: ApproveRegularizationDto,
    ): Promise<AttendanceResponseDto> {
        return this.attendanceService.approveRegularization(id, adminId, approveDto);
    }

    @Patch('regularizations/:id/reject')
    @Roles(Role.HR_ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Reject regularization request (Admin)' })
    @ApiParam({ name: 'id', description: 'Attendance ID' })
    @ApiResponse({ status: 200, description: 'Regularization rejected', type: AttendanceResponseDto })
    @ApiResponse({ status: 400, description: 'Only pending regularizations can be rejected' })
    async rejectRegularization(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('id') adminId: string,
        @Body() rejectDto: RejectRegularizationDto,
    ): Promise<AttendanceResponseDto> {
        return this.attendanceService.rejectRegularization(id, adminId, rejectDto);
    }
}