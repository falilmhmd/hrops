import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import {
    Attendance,
    AttendanceStatus,
    WorkMode,
    RegularizationStatus,
} from '../../database/entities/attendance.entity';
import { User } from '../../database/entities/user.entity';
import { Holiday } from '../../database/entities/holiday.entity';
import { LeaveRequest, LeaveRequestStatus } from '../../database/entities/leave-request.entity';
import { Role } from '../../common/enums/role.enum';
import {
    CheckInDto,
    CheckOutDto,
    RegularizeAttendanceDto,
    ApproveRegularizationDto,
    RejectRegularizationDto,
    AttendanceFilterDto,
    AttendanceSummaryFilterDto,
    AttendanceResponseDto,
    AttendanceListResponseDto,
    AttendanceSummaryDto,
    UserAttendanceSummaryDto,
    DepartmentAttendanceSummaryDto,
    PaginatedAttendanceResponseDto,
    TodayAttendanceStatusDto,
    UserInfoDto,
} from './dto';

// Default shift configuration (can be made configurable per organization later)
const DEFAULT_SHIFT_START = 9; // 9 AM
const DEFAULT_SHIFT_END = 18; // 6 PM
const DEFAULT_GRACE_PERIOD = 15; // 15 minutes grace for late
const STANDARD_WORKING_HOURS = 9; // 9 hours

@Injectable()
export class AttendanceService {
    constructor(
        @InjectRepository(Attendance)
        private attendanceRepository: Repository<Attendance>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Holiday)
        private holidayRepository: Repository<Holiday>,
        @InjectRepository(LeaveRequest)
        private leaveRequestRepository: Repository<LeaveRequest>,
        private dataSource: DataSource,
    ) { }

    // ==================== CHECK-IN ====================

    async checkIn(userId: string, checkInDto: CheckInDto): Promise<AttendanceResponseDto> {
        const user = await this.userRepository.findOne({
            where: { id: userId, isActive: true, isDeleted: false },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already checked in today (BR-ATT-EMP-001: Only one check-in per day)
        const existingAttendance = await this.attendanceRepository.findOne({
            where: { userId, date: today },
        });

        if (existingAttendance && existingAttendance.checkInTime) {
            throw new BadRequestException('Already checked in for today');
        }

        // Check if today is a holiday
        const holiday = await this.holidayRepository.findOne({
            where: { date: today },
        });

        // Check if today is a weekend (Saturday = 6, Sunday = 0)
        const dayOfWeek = today.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        // Check if user is on approved leave
        const approvedLeave = await this.leaveRequestRepository
            .createQueryBuilder('leave')
            .where('leave.userId = :userId', { userId })
            .andWhere('leave.status = :status', { status: LeaveRequestStatus.APPROVED })
            .andWhere('leave.startDate <= :today', { today })
            .andWhere('leave.endDate >= :today', { today })
            .getOne();

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Determine if late (after 9:15 AM with grace period)
        const isLate = this.isLateCheckIn(currentHour, currentMinute);
        const lateByMinutes = isLate
            ? (currentHour - DEFAULT_SHIFT_START) * 60 + currentMinute - DEFAULT_GRACE_PERIOD
            : 0;

        // Determine status
        let status: AttendanceStatus;
        if (holiday) {
            status = AttendanceStatus.HOLIDAY;
        } else if (isWeekend) {
            status = AttendanceStatus.WEEKEND;
        } else if (approvedLeave) {
            status = AttendanceStatus.ON_LEAVE;
        } else if (isLate) {
            status = AttendanceStatus.LATE;
        } else {
            status = AttendanceStatus.PRESENT;
        }

        // Create or update attendance record
        let attendance: Attendance;
        if (existingAttendance) {
            existingAttendance.checkInTime = now;
            existingAttendance.checkInLocation = checkInDto.location || null;
            existingAttendance.checkInLatitude = checkInDto.latitude || null;
            existingAttendance.checkInLongitude = checkInDto.longitude || null;
            existingAttendance.workMode = checkInDto.workMode || WorkMode.WFO;
            existingAttendance.status = status;
            existingAttendance.isLate = isLate;
            existingAttendance.lateByMinutes = lateByMinutes > 0 ? lateByMinutes : null;
            existingAttendance.notes = checkInDto.notes || null;
            attendance = existingAttendance;
        } else {
            attendance = this.attendanceRepository.create({
                userId,
                date: today,
                checkInTime: now,
                checkInLocation: checkInDto.location || null,
                checkInLatitude: checkInDto.latitude || null,
                checkInLongitude: checkInDto.longitude || null,
                workMode: checkInDto.workMode || WorkMode.WFO,
                status,
                isLate,
                lateByMinutes: lateByMinutes > 0 ? lateByMinutes : null,
                notes: checkInDto.notes || null,
                organizationId: user.organizationId,
            });
        }

        const savedAttendance = await this.attendanceRepository.save(attendance);
        return this.buildAttendanceResponse(savedAttendance);
    }

    // ==================== CHECK-OUT ====================

    async checkOut(userId: string, checkOutDto: CheckOutDto): Promise<AttendanceResponseDto> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await this.attendanceRepository.findOne({
            where: { userId, date: today },
        });

        if (!attendance || !attendance.checkInTime) {
            throw new BadRequestException('Must check in before checking out');
        }

        if (attendance.checkOutTime) {
            throw new BadRequestException('Already checked out for today');
        }

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Check for early checkout (before 6 PM)
        const isEarlyCheckout = this.isEarlyCheckOut(currentHour, currentMinute);
        const earlyCheckoutByMinutes = isEarlyCheckout
            ? (DEFAULT_SHIFT_END - currentHour) * 60 - currentMinute
            : 0;

        // Calculate working hours
        const workingHours = this.calculateWorkingHours(attendance.checkInTime, now);

        // Calculate overtime (after 6 PM)
        let overtimeHours = 0;
        if (currentHour >= DEFAULT_SHIFT_END) {
            overtimeHours = (currentHour - DEFAULT_SHIFT_END) + currentMinute / 60;
        }

        // Update attendance record
        attendance.checkOutTime = now;
        attendance.checkOutLocation = checkOutDto.location || null;
        attendance.checkOutLatitude = checkOutDto.latitude || null;
        attendance.checkOutLongitude = checkOutDto.longitude || null;
        attendance.workingHours = workingHours;
        attendance.overtimeHours = overtimeHours;
        attendance.isEarlyCheckout = isEarlyCheckout;
        attendance.earlyCheckoutByMinutes = earlyCheckoutByMinutes > 0 ? earlyCheckoutByMinutes : null;

        if (checkOutDto.notes) {
            attendance.notes = attendance.notes
                ? `${attendance.notes}\n${checkOutDto.notes}`
                : checkOutDto.notes;
        }

        // Update status to half_day if working hours < 4
        if (workingHours < 4 && attendance.status === AttendanceStatus.PRESENT) {
            attendance.status = AttendanceStatus.HALF_DAY;
        }

        const savedAttendance = await this.attendanceRepository.save(attendance);
        return this.buildAttendanceResponse(savedAttendance);
    }

    // ==================== GET TODAY'S STATUS ====================

    async getTodayStatus(userId: string): Promise<TodayAttendanceStatusDto> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await this.attendanceRepository.findOne({
            where: { userId, date: today },
        });

        if (!attendance) {
            return {
                isCheckedIn: false,
                isCheckedOut: false,
                status: AttendanceStatus.ABSENT,
                isLate: false,
            };
        }

        const workingHours = attendance.checkInTime && attendance.checkOutTime
            ? this.calculateWorkingHours(attendance.checkInTime, attendance.checkOutTime)
            : undefined;

        return {
            isCheckedIn: !!attendance.checkInTime,
            isCheckedOut: !!attendance.checkOutTime,
            checkInTime: attendance.checkInTime,
            checkOutTime: attendance.checkOutTime,
            workingHours,
            workMode: attendance.workMode,
            status: attendance.status,
            isLate: attendance.isLate,
        };
    }

    // ==================== GET ATTENDANCE BY ID ====================

    async getAttendanceById(id: string, userId: string): Promise<AttendanceResponseDto> {
        const attendance = await this.attendanceRepository.findOne({
            where: { id },
            relations: ['user', 'regularizer'],
        });

        if (!attendance) {
            throw new NotFoundException('Attendance record not found');
        }

        // Check access
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isOwner = attendance.userId === userId;
        const isAdmin =
            user.role === Role.HR_ADMIN ||
            user.role === Role.SUPER_ADMIN ||
            user.role === Role.REPORTING_MANAGER;

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException('Not authorized to view this attendance record');
        }

        return this.buildAttendanceResponse(attendance);
    }

    // ==================== GET USER ATTENDANCE HISTORY ====================

    async getUserAttendanceHistory(
        userId: string,
        filterDto: AttendanceFilterDto,
    ): Promise<PaginatedAttendanceResponseDto> {
        const { page = 1, limit = 10, month, year, startDate, endDate, status } = filterDto;

        const queryBuilder = this.attendanceRepository
            .createQueryBuilder('attendance')
            .leftJoinAndSelect('attendance.user', 'user')
            .where('attendance.userId = :userId', { userId });

        // Apply filters
        if (month && year) {
            queryBuilder.andWhere('EXTRACT(MONTH FROM attendance.date) = :month', { month });
            queryBuilder.andWhere('EXTRACT(YEAR FROM attendance.date) = :year', { year });
        } else if (year) {
            queryBuilder.andWhere('EXTRACT(YEAR FROM attendance.date) = :year', { year });
        }

        if (startDate && endDate) {
            queryBuilder.andWhere('attendance.date BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            });
        }

        if (status) {
            queryBuilder.andWhere('attendance.status = :status', { status });
        }

        // Count total
        const total = await queryBuilder.getCount();

        // Apply pagination
        queryBuilder
            .orderBy('attendance.date', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const attendances = await queryBuilder.getMany();

        return {
            data: attendances.map((a) => this.buildAttendanceListResponse(a)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    // ==================== ADMIN: GET ALL ATTENDANCE ====================

    async getAllAttendance(
        filterDto: AttendanceFilterDto,
    ): Promise<PaginatedAttendanceResponseDto> {
        const {
            page = 1,
            limit = 10,
            department,
            userId,
            month,
            year,
            startDate,
            endDate,
            status,
        } = filterDto;

        const queryBuilder = this.attendanceRepository
            .createQueryBuilder('attendance')
            .leftJoinAndSelect('attendance.user', 'user');

        // Apply filters
        if (department) {
            queryBuilder.andWhere('user.department = :department', { department });
        }

        if (userId) {
            queryBuilder.andWhere('attendance.userId = :userId', { userId });
        }

        if (month && year) {
            queryBuilder.andWhere('EXTRACT(MONTH FROM attendance.date) = :month', { month });
            queryBuilder.andWhere('EXTRACT(YEAR FROM attendance.date) = :year', { year });
        } else if (year) {
            queryBuilder.andWhere('EXTRACT(YEAR FROM attendance.date) = :year', { year });
        }

        if (startDate && endDate) {
            queryBuilder.andWhere('attendance.date BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            });
        }

        if (status) {
            queryBuilder.andWhere('attendance.status = :status', { status });
        }

        // Count total
        const total = await queryBuilder.getCount();

        // Apply pagination
        queryBuilder
            .orderBy('attendance.date', 'DESC')
            .addOrderBy('user.firstName', 'ASC')
            .skip((page - 1) * limit)
            .take(limit);

        const attendances = await queryBuilder.getMany();

        return {
            data: attendances.map((a) => this.buildAttendanceListResponse(a)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    // ==================== ATTENDANCE SUMMARY ====================

    async getAttendanceSummary(
        filterDto: AttendanceSummaryFilterDto,
    ): Promise<UserAttendanceSummaryDto[]> {
        const { department, userId, month, year } = filterDto;

        // Default to current month/year if not provided
        const currentDate = new Date();
        const targetMonth = month || currentDate.getMonth() + 1;
        const targetYear = year || currentDate.getFullYear();

        // Build user query
        const userQueryBuilder = this.userRepository
            .createQueryBuilder('user')
            .where('user.isActive = :isActive', { isActive: true })
            .andWhere('user.isDeleted = :isDeleted', { isDeleted: false });

        if (department) {
            userQueryBuilder.andWhere('user.department = :department', { department });
        }

        if (userId) {
            userQueryBuilder.andWhere('user.id = :userId', { userId });
        }

        const users = await userQueryBuilder.getMany();

        // Get attendance for each user
        const summaries: UserAttendanceSummaryDto[] = [];

        for (const user of users) {
            const attendances = await this.attendanceRepository
                .createQueryBuilder('attendance')
                .where('attendance.userId = :userId', { userId: user.id })
                .andWhere('EXTRACT(MONTH FROM attendance.date) = :month', { month: targetMonth })
                .andWhere('EXTRACT(YEAR FROM attendance.date) = :year', { year: targetYear })
                .getMany();

            const summary = this.calculateAttendanceSummary(attendances, targetMonth, targetYear);

            summaries.push({
                userId: user.id,
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    department: user.department,
                    designation: user.designation,
                    employeeId: user.employeeId,
                },
                summary,
            });
        }

        return summaries;
    }

    // ==================== DEPARTMENT ATTENDANCE SUMMARY ====================

    async getDepartmentAttendanceSummary(): Promise<DepartmentAttendanceSummaryDto[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all departments
        const departments = await this.userRepository
            .createQueryBuilder('user')
            .select('user.department', 'department')
            .where('user.department IS NOT NULL')
            .groupBy('user.department')
            .getRawMany();

        const summaries: DepartmentAttendanceSummaryDto[] = [];

        for (const dept of departments) {
            const department = dept.department;

            // Get total employees in department
            const totalEmployees = await this.userRepository.count({
                where: {
                    department,
                    isActive: true,
                    isDeleted: false,
                },
            });

            // Get today's attendance for department
            const todayAttendances = await this.attendanceRepository
                .createQueryBuilder('attendance')
                .leftJoin('attendance.user', 'user')
                .where('user.department = :department', { department })
                .andWhere('attendance.date = :today', { today })
                .getMany();

            const presentToday = todayAttendances.filter(
                (a) =>
                    a.status === AttendanceStatus.PRESENT ||
                    a.status === AttendanceStatus.LATE ||
                    a.status === AttendanceStatus.HALF_DAY,
            ).length;

            const absentToday = todayAttendances.filter(
                (a) => a.status === AttendanceStatus.ABSENT,
            ).length;

            const lateToday = todayAttendances.filter(
                (a) => a.status === AttendanceStatus.LATE,
            ).length;

            const onLeaveToday = todayAttendances.filter(
                (a) => a.status === AttendanceStatus.ON_LEAVE,
            ).length;

            const attendancePercentage =
                totalEmployees > 0
                    ? Math.round((presentToday / totalEmployees) * 100)
                    : 0;

            summaries.push({
                department,
                totalEmployees,
                presentToday,
                absentToday,
                lateToday,
                onLeaveToday,
                attendancePercentage,
            });
        }

        return summaries;
    }

    // ==================== REGULARIZATION ====================

    async requestRegularization(
        adminId: string,
        regularizeDto: RegularizeAttendanceDto,
    ): Promise<AttendanceResponseDto> {
        const admin = await this.userRepository.findOne({ where: { id: adminId } });
        if (!admin) {
            throw new NotFoundException('Admin not found');
        }

        // Check if admin has permission
        if (
            admin.role !== Role.HR_ADMIN &&
            admin.role !== Role.SUPER_ADMIN &&
            admin.role !== Role.REPORTING_MANAGER
        ) {
            throw new ForbiddenException('Not authorized to regularize attendance');
        }

        const user = await this.userRepository.findOne({
            where: { id: regularizeDto.userId, isActive: true, isDeleted: false },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // If reporting manager, can only regularize their team members
        if (admin.role === Role.REPORTING_MANAGER) {
            if (user.reportingManagerId !== adminId) {
                throw new ForbiddenException(
                    'Can only regularize attendance for your team members',
                );
            }
        }

        const date = new Date(regularizeDto.date);
        date.setHours(0, 0, 0, 0);

        // Check if date is in the future
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date > today) {
            throw new BadRequestException('Cannot regularize future dates');
        }

        // Find or create attendance record
        let attendance = await this.attendanceRepository.findOne({
            where: { userId: regularizeDto.userId, date },
        });

        if (attendance) {
            // Update existing record
            attendance.isRegularized = true;
            attendance.regularizationStatus = RegularizationStatus.APPROVED;
            attendance.regularizationReason = regularizeDto.reason;
            attendance.regularizedBy = adminId;
            attendance.regularizedAt = new Date();
            attendance.regularizationComments = regularizeDto.comments || null;

            if (regularizeDto.status) {
                attendance.status = regularizeDto.status;
            }

            if (regularizeDto.checkInTime) {
                attendance.checkInTime = new Date(regularizeDto.checkInTime);
            }

            if (regularizeDto.checkOutTime) {
                attendance.checkOutTime = new Date(regularizeDto.checkOutTime);
            }

            // Recalculate working hours if both times are present
            if (attendance.checkInTime && attendance.checkOutTime) {
                attendance.workingHours = this.calculateWorkingHours(
                    attendance.checkInTime,
                    attendance.checkOutTime,
                );
            }
        } else {
            // Create new attendance record
            attendance = this.attendanceRepository.create({
                userId: regularizeDto.userId,
                date,
                status: regularizeDto.status || AttendanceStatus.PRESENT,
                checkInTime: regularizeDto.checkInTime
                    ? new Date(regularizeDto.checkInTime)
                    : undefined,
                checkOutTime: regularizeDto.checkOutTime
                    ? new Date(regularizeDto.checkOutTime)
                    : undefined,
                isRegularized: true,
                regularizationStatus: RegularizationStatus.APPROVED,
                regularizationReason: regularizeDto.reason,
                regularizedBy: adminId,
                regularizedAt: new Date(),
                regularizationComments: regularizeDto.comments,
                organizationId: user.organizationId,
            });

            // Calculate working hours if both times are present
            if (attendance.checkInTime && attendance.checkOutTime) {
                attendance.workingHours = this.calculateWorkingHours(
                    attendance.checkInTime,
                    attendance.checkOutTime,
                );
            }
        }

        const savedAttendance = await this.attendanceRepository.save(attendance);
        return this.buildAttendanceResponse(savedAttendance);
    }

    async getPendingRegularizations(): Promise<AttendanceListResponseDto[]> {
        const attendances = await this.attendanceRepository
            .createQueryBuilder('attendance')
            .leftJoinAndSelect('attendance.user', 'user')
            .leftJoinAndSelect('attendance.regularizer', 'regularizer')
            .where('attendance.isRegularized = :isRegularized', { isRegularized: true })
            .andWhere('attendance.regularizationStatus = :status', {
                status: RegularizationStatus.PENDING,
            })
            .orderBy('attendance.regularizedAt', 'DESC')
            .getMany();

        return attendances.map((a) => this.buildAttendanceListResponse(a));
    }

    async approveRegularization(
        id: string,
        adminId: string,
        approveDto: ApproveRegularizationDto,
    ): Promise<AttendanceResponseDto> {
        const attendance = await this.attendanceRepository.findOne({
            where: { id },
            relations: ['user'],
        });

        if (!attendance) {
            throw new NotFoundException('Attendance record not found');
        }

        if (attendance.regularizationStatus !== RegularizationStatus.PENDING) {
            throw new BadRequestException('Only pending regularizations can be approved');
        }

        attendance.regularizationStatus = RegularizationStatus.APPROVED;
        attendance.regularizedBy = adminId;
        attendance.regularizedAt = new Date();
        if (approveDto.comments) {
            attendance.regularizationComments = approveDto.comments;
        }

        const savedAttendance = await this.attendanceRepository.save(attendance);
        return this.buildAttendanceResponse(savedAttendance);
    }

    async rejectRegularization(
        id: string,
        adminId: string,
        rejectDto: RejectRegularizationDto,
    ): Promise<AttendanceResponseDto> {
        const attendance = await this.attendanceRepository.findOne({
            where: { id },
            relations: ['user'],
        });

        if (!attendance) {
            throw new NotFoundException('Attendance record not found');
        }

        if (attendance.regularizationStatus !== RegularizationStatus.PENDING) {
            throw new BadRequestException('Only pending regularizations can be rejected');
        }

        attendance.regularizationStatus = RegularizationStatus.REJECTED;
        attendance.regularizedBy = adminId;
        attendance.regularizedAt = new Date();
        attendance.regularizationComments = rejectDto.rejectionReason;

        const savedAttendance = await this.attendanceRepository.save(attendance);
        return this.buildAttendanceResponse(savedAttendance);
    }

    // ==================== HELPER METHODS ====================

    private isLateCheckIn(hour: number, minute: number): boolean {
        const shiftStartMinutes = DEFAULT_SHIFT_START * 60 + DEFAULT_GRACE_PERIOD;
        const checkInMinutes = hour * 60 + minute;
        return checkInMinutes > shiftStartMinutes;
    }

    private isEarlyCheckOut(hour: number, minute: number): boolean {
        const shiftEndMinutes = DEFAULT_SHIFT_END * 60;
        const checkOutMinutes = hour * 60 + minute;
        return checkOutMinutes < shiftEndMinutes;
    }

    private calculateWorkingHours(checkIn: Date, checkOut: Date): number {
        const diffMs = checkOut.getTime() - checkIn.getTime();
        return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    }

    private calculateAttendanceSummary(
        attendances: Attendance[],
        month: number,
        year: number,
    ): AttendanceSummaryDto {
        // Get total working days in month (excluding weekends)
        const daysInMonth = new Date(year, month, 0).getDate();
        let workingDays = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const dayOfWeek = date.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                workingDays++;
            }
        }

        const presentDays = attendances.filter(
            (a) =>
                a.status === AttendanceStatus.PRESENT ||
                a.status === AttendanceStatus.LATE ||
                a.status === AttendanceStatus.HALF_DAY,
        ).length;

        const absentDays = attendances.filter(
            (a) => a.status === AttendanceStatus.ABSENT,
        ).length;

        const lateDays = attendances.filter(
            (a) => a.status === AttendanceStatus.LATE,
        ).length;

        const halfDays = attendances.filter(
            (a) => a.status === AttendanceStatus.HALF_DAY,
        ).length;

        const onLeaveDays = attendances.filter(
            (a) => a.status === AttendanceStatus.ON_LEAVE,
        ).length;

        const holidayDays = attendances.filter(
            (a) => a.status === AttendanceStatus.HOLIDAY,
        ).length;

        const weekendDays = attendances.filter(
            (a) => a.status === AttendanceStatus.WEEKEND,
        ).length;

        const totalWorkingHours = attendances.reduce(
            (sum, a) => sum + (a.workingHours || 0),
            0,
        );

        const averageWorkingHours = presentDays > 0 ? totalWorkingHours / presentDays : 0;

        const totalOvertimeHours = attendances.reduce(
            (sum, a) => sum + (a.overtimeHours || 0),
            0,
        );

        const latePercentage = workingDays > 0 ? (lateDays / workingDays) * 100 : 0;

        const attendancePercentage = workingDays > 0 ? (presentDays / workingDays) * 100 : 0;

        return {
            totalDays: daysInMonth,
            presentDays,
            absentDays,
            lateDays,
            halfDays,
            onLeaveDays,
            holidayDays,
            weekendDays,
            totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
            averageWorkingHours: Math.round(averageWorkingHours * 100) / 100,
            totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
            latePercentage: Math.round(latePercentage * 100) / 100,
            attendancePercentage: Math.round(attendancePercentage * 100) / 100,
        };
    }

    private buildUserInfo(user: User): UserInfoDto {
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            department: user.department,
            designation: user.designation,
            employeeId: user.employeeId,
        };
    }

    private buildAttendanceResponse(attendance: Attendance): AttendanceResponseDto {
        return {
            id: attendance.id,
            userId: attendance.userId,
            user: attendance.user ? this.buildUserInfo(attendance.user) : undefined,
            date: attendance.date,
            checkInTime: attendance.checkInTime,
            checkOutTime: attendance.checkOutTime,
            checkInLocation: attendance.checkInLocation,
            checkOutLocation: attendance.checkOutLocation,
            workMode: attendance.workMode,
            status: attendance.status,
            workingHours: attendance.workingHours,
            overtimeHours: attendance.overtimeHours,
            isLate: attendance.isLate,
            lateByMinutes: attendance.lateByMinutes,
            isEarlyCheckout: attendance.isEarlyCheckout,
            earlyCheckoutByMinutes: attendance.earlyCheckoutByMinutes,
            isRegularized: attendance.isRegularized,
            regularizationStatus: attendance.regularizationStatus,
            regularizationReason: attendance.regularizationReason,
            regularizedBy: attendance.regularizedBy,
            regularizer: attendance.regularizer
                ? this.buildUserInfo(attendance.regularizer)
                : undefined,
            regularizedAt: attendance.regularizedAt,
            regularizationComments: attendance.regularizationComments,
            notes: attendance.notes,
            organizationId: attendance.organizationId,
            createdAt: attendance.createdAt,
            updatedAt: attendance.updatedAt,
        };
    }

    private buildAttendanceListResponse(attendance: Attendance): AttendanceListResponseDto {
        return {
            id: attendance.id,
            userId: attendance.userId,
            user: attendance.user ? this.buildUserInfo(attendance.user) : undefined,
            date: attendance.date,
            checkInTime: attendance.checkInTime,
            checkOutTime: attendance.checkOutTime,
            status: attendance.status,
            workingHours: attendance.workingHours,
            isLate: attendance.isLate,
            isRegularized: attendance.isRegularized,
            createdAt: attendance.createdAt,
        };
    }
}