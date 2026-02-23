import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, In } from 'typeorm';
import { LeaveRequest, LeaveRequestStatus, LeaveDuration } from '../../database/entities/leave-request.entity';
import { LeaveBalance } from '../../database/entities/leave-balance.entity';
import { LeaveType } from '../../database/entities/leave-type.entity';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../common/enums/role.enum';
import {
    CreateLeaveRequestDto,
    UpdateLeaveRequestDto,
    ApproveLeaveRequestDto,
    RejectLeaveRequestDto,
    RequestModificationDto,
    LeaveRequestResponseDto,
    LeaveRequestListResponseDto,
    LeaveBalanceSummaryDto,
} from './dto';

@Injectable()
export class LeaveRequestService {
    constructor(
        @InjectRepository(LeaveRequest)
        private leaveRequestRepository: Repository<LeaveRequest>,
        @InjectRepository(LeaveBalance)
        private leaveBalanceRepository: Repository<LeaveBalance>,
        @InjectRepository(LeaveType)
        private leaveTypeRepository: Repository<LeaveType>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private dataSource: DataSource,
    ) { }

    // ==================== CREATE LEAVE REQUEST ====================

    async createLeaveRequest(
        userId: string,
        createDto: CreateLeaveRequestDto,
    ): Promise<LeaveRequestResponseDto> {
        const user = await this.userRepository.findOne({
            where: { id: userId, isActive: true, isDeleted: false },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const leaveType = await this.leaveTypeRepository.findOne({
            where: { id: createDto.leaveTypeId, isActive: true },
        });
        if (!leaveType) {
            throw new NotFoundException('Leave type not found');
        }

        // Check if leave type is applicable to user's role
        if (!leaveType.applicableRoles.includes(user.role)) {
            throw new ForbiddenException('This leave type is not applicable to your role');
        }

        // Validate dates
        const startDate = new Date(createDto.startDate);
        const endDate = new Date(createDto.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate < today) {
            throw new BadRequestException('Start date cannot be in the past');
        }

        if (endDate < startDate) {
            throw new BadRequestException('End date cannot be before start date');
        }

        // Check for overlapping leaves (BR-LEAVE-EMP-002)
        const overlappingLeave = await this.leaveRequestRepository.findOne({
            where: {
                userId,
                status: In([
                    LeaveRequestStatus.PENDING,
                    LeaveRequestStatus.APPROVED,
                    LeaveRequestStatus.MODIFICATION_REQUESTED,
                ]),
                startDate: Between(startDate, endDate),
            },
        });

        if (overlappingLeave) {
            throw new BadRequestException(
                'You already have a leave request that overlaps with these dates',
            );
        }

        // Also check for overlapping end dates
        const overlappingLeaveEnd = await this.leaveRequestRepository
            .createQueryBuilder('leave')
            .where('leave.userId = :userId', { userId })
            .andWhere('leave.status IN (:...statuses)', {
                statuses: [
                    LeaveRequestStatus.PENDING,
                    LeaveRequestStatus.APPROVED,
                    LeaveRequestStatus.MODIFICATION_REQUESTED,
                ],
            })
            .andWhere('leave.endDate >= :startDate', { startDate })
            .andWhere('leave.startDate <= :endDate', { endDate })
            .getOne();

        if (overlappingLeaveEnd) {
            throw new BadRequestException(
                'You already have a leave request that overlaps with these dates',
            );
        }

        // Check leave balance (BR-LEAVE-002: LOP has no balance restriction)
        const currentYear = new Date().getFullYear();
        let leaveBalance = await this.leaveBalanceRepository.findOne({
            where: {
                userId,
                leaveTypeId: createDto.leaveTypeId,
                year: currentYear,
            },
        });

        // If leave type has balance restriction, validate balance
        if (leaveType.hasBalanceRestriction) {
            if (!leaveBalance) {
                throw new BadRequestException(
                    'You do not have a leave balance for this leave type',
                );
            }

            const availableBalance = leaveBalance.availableBalance;
            if (createDto.numberOfDays > availableBalance) {
                throw new BadRequestException(
                    `Insufficient leave balance. Available: ${availableBalance} days, Requested: ${createDto.numberOfDays} days`,
                );
            }
        }

        // Check max consecutive days
        if (leaveType.maxConsecutiveDays && createDto.numberOfDays > leaveType.maxConsecutiveDays) {
            throw new BadRequestException(
                `Maximum consecutive days allowed for this leave type is ${leaveType.maxConsecutiveDays}`,
            );
        }

        // Create leave request
        const leaveRequest = this.leaveRequestRepository.create({
            userId,
            leaveTypeId: createDto.leaveTypeId,
            startDate,
            endDate,
            startDuration: createDto.startDuration || LeaveDuration.FULL_DAY,
            endDuration: createDto.endDuration || LeaveDuration.FULL_DAY,
            numberOfDays: createDto.numberOfDays,
            reason: createDto.reason,
            attachment: createDto.attachment,
            status: LeaveRequestStatus.PENDING,
            organizationId: user.organizationId,
        });

        const savedRequest = await this.leaveRequestRepository.save(leaveRequest);

        // Update pending days in leave balance (BR-LEAVE-004: Leave deducted only after approval)
        // But we track pending days to show reserved balance
        if (leaveBalance && leaveType.hasBalanceRestriction) {
            leaveBalance.pendingDays += createDto.numberOfDays;
            await this.leaveBalanceRepository.save(leaveBalance);
        }

        return this.buildLeaveRequestResponse(savedRequest);
    }

    // ==================== UPDATE LEAVE REQUEST ====================

    async updateLeaveRequest(
        id: string,
        userId: string,
        updateDto: UpdateLeaveRequestDto,
    ): Promise<LeaveRequestResponseDto> {
        const leaveRequest = await this.leaveRequestRepository.findOne({
            where: { id },
            relations: ['leaveType'],
        });

        if (!leaveRequest) {
            throw new NotFoundException('Leave request not found');
        }

        if (leaveRequest.userId !== userId) {
            throw new ForbiddenException('You can only update your own leave requests');
        }

        if (!leaveRequest.canBeModified) {
            throw new BadRequestException(
                'This leave request cannot be modified in its current status',
            );
        }

        const previousDays = leaveRequest.numberOfDays;
        const previousStatus = leaveRequest.status;

        // Update fields
        if (updateDto.startDate) {
            leaveRequest.startDate = new Date(updateDto.startDate);
        }
        if (updateDto.endDate) {
            leaveRequest.endDate = new Date(updateDto.endDate);
        }
        if (updateDto.startDuration) {
            leaveRequest.startDuration = updateDto.startDuration;
        }
        if (updateDto.endDuration) {
            leaveRequest.endDuration = updateDto.endDuration;
        }
        if (updateDto.numberOfDays) {
            leaveRequest.numberOfDays = updateDto.numberOfDays;
        }
        if (updateDto.reason) {
            leaveRequest.reason = updateDto.reason;
        }
        if (updateDto.attachment !== undefined) {
            leaveRequest.attachment = updateDto.attachment;
        }

        // Reset status to pending if it was modification_requested
        if (previousStatus === LeaveRequestStatus.MODIFICATION_REQUESTED) {
            leaveRequest.status = LeaveRequestStatus.PENDING;
            leaveRequest.modificationRequestReason = null;
        }

        // Validate dates
        if (leaveRequest.endDate < leaveRequest.startDate) {
            throw new BadRequestException('End date cannot be before start date');
        }

        // Check for overlapping leaves
        const overlappingLeave = await this.leaveRequestRepository
            .createQueryBuilder('leave')
            .where('leave.userId = :userId', { userId })
            .andWhere('leave.id != :id', { id })
            .andWhere('leave.status IN (:...statuses)', {
                statuses: [
                    LeaveRequestStatus.PENDING,
                    LeaveRequestStatus.APPROVED,
                    LeaveRequestStatus.MODIFICATION_REQUESTED,
                ],
            })
            .andWhere('leave.endDate >= :startDate', { startDate: leaveRequest.startDate })
            .andWhere('leave.startDate <= :endDate', { endDate: leaveRequest.endDate })
            .getOne();

        if (overlappingLeave) {
            throw new BadRequestException(
                'You already have a leave request that overlaps with these dates',
            );
        }

        // Update leave balance pending days
        if (leaveRequest.leaveType.hasBalanceRestriction) {
            const currentYear = new Date().getFullYear();
            const leaveBalance = await this.leaveBalanceRepository.findOne({
                where: {
                    userId,
                    leaveTypeId: leaveRequest.leaveTypeId,
                    year: currentYear,
                },
            });

            if (leaveBalance) {
                const daysDifference = leaveRequest.numberOfDays - previousDays;
                leaveBalance.pendingDays += daysDifference;

                if (leaveBalance.pendingDays < 0) {
                    leaveBalance.pendingDays = 0;
                }

                await this.leaveBalanceRepository.save(leaveBalance);
            }
        }

        const savedRequest = await this.leaveRequestRepository.save(leaveRequest);
        return this.buildLeaveRequestResponse(savedRequest);
    }

    // ==================== CANCEL LEAVE REQUEST ====================

    async cancelLeaveRequest(
        id: string,
        userId: string,
        cancellationReason?: string,
    ): Promise<LeaveRequestResponseDto> {
        const leaveRequest = await this.leaveRequestRepository.findOne({
            where: { id },
            relations: ['leaveType'],
        });

        if (!leaveRequest) {
            throw new NotFoundException('Leave request not found');
        }

        if (leaveRequest.userId !== userId) {
            throw new ForbiddenException('You can only cancel your own leave requests');
        }

        if (!leaveRequest.canBeCancelled) {
            throw new BadRequestException(
                'This leave request cannot be cancelled in its current status',
            );
        }

        leaveRequest.status = LeaveRequestStatus.CANCELLED;
        leaveRequest.cancelledAt = new Date();
        if (cancellationReason) {
            leaveRequest.cancellationReason = cancellationReason;
        }

        // Restore pending days in leave balance
        if (leaveRequest.leaveType.hasBalanceRestriction) {
            const currentYear = new Date().getFullYear();
            const leaveBalance = await this.leaveBalanceRepository.findOne({
                where: {
                    userId,
                    leaveTypeId: leaveRequest.leaveTypeId,
                    year: currentYear,
                },
            });

            if (leaveBalance) {
                leaveBalance.pendingDays -= leaveRequest.numberOfDays;
                if (leaveBalance.pendingDays < 0) {
                    leaveBalance.pendingDays = 0;
                }
                await this.leaveBalanceRepository.save(leaveBalance);
            }
        }

        const savedRequest = await this.leaveRequestRepository.save(leaveRequest);
        return this.buildLeaveRequestResponse(savedRequest);
    }

    // ==================== APPROVE LEAVE REQUEST (BR-LEAVE-004) ====================

    async approveLeaveRequest(
        id: string,
        approverId: string,
        approveDto: ApproveLeaveRequestDto,
    ): Promise<LeaveRequestResponseDto> {
        const leaveRequest = await this.leaveRequestRepository.findOne({
            where: { id },
            relations: ['user', 'leaveType'],
        });

        if (!leaveRequest) {
            throw new NotFoundException('Leave request not found');
        }

        if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
            throw new BadRequestException('Only pending leave requests can be approved');
        }

        const approver = await this.userRepository.findOne({ where: { id: approverId } });
        if (!approver) {
            throw new NotFoundException('Approver not found');
        }

        // Check if approver is authorized (HR Admin, Super Admin, or Reporting Manager)
        const isAuthorized =
            approver.role === Role.HR_ADMIN ||
            approver.role === Role.SUPER_ADMIN ||
            (approver.role === Role.REPORTING_MANAGER &&
                leaveRequest.user.reportingManagerId === approverId);

        if (!isAuthorized) {
            throw new ForbiddenException('You are not authorized to approve this leave request');
        }

        // Use transaction to ensure data consistency
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Update leave request status
            leaveRequest.status = LeaveRequestStatus.APPROVED;
            leaveRequest.approverId = approverId;
            if (approveDto.approverComments) {
                leaveRequest.approverComments = approveDto.approverComments;
            }
            leaveRequest.approvedAt = new Date();

            // Update leave balance (BR-LEAVE-004: Leave deducted only after approval)
            if (leaveRequest.leaveType.hasBalanceRestriction) {
                const currentYear = new Date().getFullYear();
                const leaveBalance = await queryRunner.manager.findOne(LeaveBalance, {
                    where: {
                        userId: leaveRequest.userId,
                        leaveTypeId: leaveRequest.leaveTypeId,
                        year: currentYear,
                    },
                });

                if (leaveBalance) {
                    // Move from pending to used
                    leaveBalance.pendingDays -= leaveRequest.numberOfDays;
                    leaveBalance.usedDays += leaveRequest.numberOfDays;
                    leaveBalance.remainingDays =
                        leaveBalance.totalAllocated +
                        leaveBalance.carriedForwardDays -
                        leaveBalance.usedDays -
                        leaveBalance.pendingDays;

                    if (leaveBalance.pendingDays < 0) {
                        leaveBalance.pendingDays = 0;
                    }

                    await queryRunner.manager.save(leaveBalance);
                }
            }

            await queryRunner.manager.save(leaveRequest);
            await queryRunner.commitTransaction();

            return this.buildLeaveRequestResponse(leaveRequest);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // ==================== REJECT LEAVE REQUEST (BR-LEAVE-005) ====================

    async rejectLeaveRequest(
        id: string,
        approverId: string,
        rejectDto: RejectLeaveRequestDto,
    ): Promise<LeaveRequestResponseDto> {
        const leaveRequest = await this.leaveRequestRepository.findOne({
            where: { id },
            relations: ['user', 'leaveType'],
        });

        if (!leaveRequest) {
            throw new NotFoundException('Leave request not found');
        }

        if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
            throw new BadRequestException('Only pending leave requests can be rejected');
        }

        const approver = await this.userRepository.findOne({ where: { id: approverId } });
        if (!approver) {
            throw new NotFoundException('Approver not found');
        }

        // Check if approver is authorized
        const isAuthorized =
            approver.role === Role.HR_ADMIN ||
            approver.role === Role.SUPER_ADMIN ||
            (approver.role === Role.REPORTING_MANAGER &&
                leaveRequest.user.reportingManagerId === approverId);

        if (!isAuthorized) {
            throw new ForbiddenException('You are not authorized to reject this leave request');
        }

        // Use transaction to ensure data consistency
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Update leave request status
            leaveRequest.status = LeaveRequestStatus.REJECTED;
            leaveRequest.approverId = approverId;
            leaveRequest.rejectionReason = rejectDto.rejectionReason;
            leaveRequest.rejectedAt = new Date();

            // Restore balance (BR-LEAVE-005: Rejected leave restores balance)
            if (leaveRequest.leaveType.hasBalanceRestriction) {
                const currentYear = new Date().getFullYear();
                const leaveBalance = await queryRunner.manager.findOne(LeaveBalance, {
                    where: {
                        userId: leaveRequest.userId,
                        leaveTypeId: leaveRequest.leaveTypeId,
                        year: currentYear,
                    },
                });

                if (leaveBalance) {
                    // Remove from pending
                    leaveBalance.pendingDays -= leaveRequest.numberOfDays;
                    leaveBalance.remainingDays =
                        leaveBalance.totalAllocated +
                        leaveBalance.carriedForwardDays -
                        leaveBalance.usedDays -
                        leaveBalance.pendingDays;

                    if (leaveBalance.pendingDays < 0) {
                        leaveBalance.pendingDays = 0;
                    }

                    await queryRunner.manager.save(leaveBalance);
                }
            }

            await queryRunner.manager.save(leaveRequest);
            await queryRunner.commitTransaction();

            return this.buildLeaveRequestResponse(leaveRequest);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // ==================== REQUEST MODIFICATION ====================

    async requestModification(
        id: string,
        approverId: string,
        modificationDto: RequestModificationDto,
    ): Promise<LeaveRequestResponseDto> {
        const leaveRequest = await this.leaveRequestRepository.findOne({
            where: { id },
            relations: ['user'],
        });

        if (!leaveRequest) {
            throw new NotFoundException('Leave request not found');
        }

        if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
            throw new BadRequestException(
                'Only pending leave requests can have modification requested',
            );
        }

        const approver = await this.userRepository.findOne({ where: { id: approverId } });
        if (!approver) {
            throw new NotFoundException('Approver not found');
        }

        // Check if approver is authorized
        const isAuthorized =
            approver.role === Role.HR_ADMIN ||
            approver.role === Role.SUPER_ADMIN ||
            (approver.role === Role.REPORTING_MANAGER &&
                leaveRequest.user.reportingManagerId === approverId);

        if (!isAuthorized) {
            throw new ForbiddenException(
                'You are not authorized to request modification for this leave request',
            );
        }

        leaveRequest.status = LeaveRequestStatus.MODIFICATION_REQUESTED;
        leaveRequest.approverId = approverId;
        leaveRequest.modificationRequestReason = modificationDto.modificationRequestReason;

        const savedRequest = await this.leaveRequestRepository.save(leaveRequest);
        return this.buildLeaveRequestResponse(savedRequest);
    }

    // ==================== GET LEAVE REQUESTS ====================

    async getLeaveRequestById(id: string, userId: string): Promise<LeaveRequestResponseDto> {
        const leaveRequest = await this.leaveRequestRepository.findOne({
            where: { id },
            relations: ['user', 'leaveType', 'approver'],
        });

        if (!leaveRequest) {
            throw new NotFoundException('Leave request not found');
        }

        // Check access - user can only view their own requests unless they are admin/manager
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isOwner = leaveRequest.userId === userId;
        const isAdmin =
            user.role === Role.HR_ADMIN ||
            user.role === Role.SUPER_ADMIN ||
            user.role === Role.REPORTING_MANAGER;

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException('You are not authorized to view this leave request');
        }

        return this.buildLeaveRequestResponse(leaveRequest);
    }

    async getUserLeaveRequests(
        userId: string,
        status?: LeaveRequestStatus,
        year?: number,
    ): Promise<LeaveRequestListResponseDto[]> {
        const queryBuilder = this.leaveRequestRepository
            .createQueryBuilder('leaveRequest')
            .leftJoinAndSelect('leaveRequest.user', 'user')
            .leftJoinAndSelect('leaveRequest.leaveType', 'leaveType')
            .leftJoinAndSelect('leaveRequest.approver', 'approver')
            .where('leaveRequest.userId = :userId', { userId });

        if (status) {
            queryBuilder.andWhere('leaveRequest.status = :status', { status });
        }

        if (year) {
            queryBuilder.andWhere('EXTRACT(YEAR FROM leaveRequest.startDate) = :year', { year });
        }

        queryBuilder.orderBy('leaveRequest.createdAt', 'DESC');

        const leaveRequests = await queryBuilder.getMany();
        return leaveRequests.map((lr) => this.buildLeaveRequestListResponse(lr));
    }

    async getPendingApprovals(
        approverId: string,
    ): Promise<LeaveRequestListResponseDto[]> {
        const approver = await this.userRepository.findOne({ where: { id: approverId } });
        if (!approver) {
            throw new NotFoundException('Approver not found');
        }

        const queryBuilder = this.leaveRequestRepository
            .createQueryBuilder('leaveRequest')
            .leftJoinAndSelect('leaveRequest.user', 'user')
            .leftJoinAndSelect('leaveRequest.leaveType', 'leaveType')
            .leftJoinAndSelect('leaveRequest.approver', 'approver')
            .where('leaveRequest.status = :status', { status: LeaveRequestStatus.PENDING });

        // Filter based on role
        if (approver.role === Role.REPORTING_MANAGER) {
            queryBuilder.andWhere('user.reportingManagerId = :approverId', { approverId });
        }
        // HR Admin and Super Admin can see all pending requests

        queryBuilder.orderBy('leaveRequest.createdAt', 'ASC');

        const leaveRequests = await queryBuilder.getMany();
        return leaveRequests.map((lr) => this.buildLeaveRequestListResponse(lr));
    }

    async getAllLeaveRequests(
        status?: LeaveRequestStatus,
        department?: string,
        year?: number,
    ): Promise<LeaveRequestListResponseDto[]> {
        const queryBuilder = this.leaveRequestRepository
            .createQueryBuilder('leaveRequest')
            .leftJoinAndSelect('leaveRequest.user', 'user')
            .leftJoinAndSelect('leaveRequest.leaveType', 'leaveType')
            .leftJoinAndSelect('leaveRequest.approver', 'approver');

        if (status) {
            queryBuilder.andWhere('leaveRequest.status = :status', { status });
        }

        if (department) {
            queryBuilder.andWhere('user.department = :department', { department });
        }

        if (year) {
            queryBuilder.andWhere('EXTRACT(YEAR FROM leaveRequest.startDate) = :year', { year });
        }

        queryBuilder.orderBy('leaveRequest.createdAt', 'DESC');

        const leaveRequests = await queryBuilder.getMany();
        return leaveRequests.map((lr) => this.buildLeaveRequestListResponse(lr));
    }

    // ==================== LEAVE BALANCE SUMMARY ====================

    async getUserLeaveBalanceSummary(userId: string): Promise<LeaveBalanceSummaryDto[]> {
        const currentYear = new Date().getFullYear();

        const leaveBalances = await this.leaveBalanceRepository.find({
            where: { userId, year: currentYear },
            relations: ['leaveType'],
        });

        return leaveBalances.map((lb) => ({
            leaveTypeId: lb.leaveTypeId,
            leaveTypeName: lb.leaveType?.name || 'Unknown',
            totalAllocated: lb.totalAllocated,
            usedDays: lb.usedDays,
            pendingDays: lb.pendingDays,
            carriedForwardDays: lb.carriedForwardDays,
            remainingDays: lb.remainingDays,
            availableBalance: lb.availableBalance,
        }));
    }

    // ==================== HELPER METHODS ====================

    private buildLeaveRequestResponse(leaveRequest: LeaveRequest): LeaveRequestResponseDto {
        return {
            id: leaveRequest.id,
            userId: leaveRequest.userId,
            user: leaveRequest.user
                ? {
                    id: leaveRequest.user.id,
                    firstName: leaveRequest.user.firstName,
                    lastName: leaveRequest.user.lastName,
                    email: leaveRequest.user.email,
                    department: leaveRequest.user.department,
                    designation: leaveRequest.user.designation,
                }
                : undefined,
            leaveTypeId: leaveRequest.leaveTypeId,
            leaveType: leaveRequest.leaveType
                ? {
                    id: leaveRequest.leaveType.id,
                    name: leaveRequest.leaveType.name,
                    hasBalanceRestriction: leaveRequest.leaveType.hasBalanceRestriction,
                }
                : undefined,
            startDate: leaveRequest.startDate,
            endDate: leaveRequest.endDate,
            startDuration: leaveRequest.startDuration,
            endDuration: leaveRequest.endDuration,
            numberOfDays: leaveRequest.numberOfDays,
            reason: leaveRequest.reason,
            attachment: leaveRequest.attachment,
            status: leaveRequest.status,
            approverId: leaveRequest.approverId,
            approver: leaveRequest.approver
                ? {
                    id: leaveRequest.approver.id,
                    firstName: leaveRequest.approver.firstName,
                    lastName: leaveRequest.approver.lastName,
                    email: leaveRequest.approver.email,
                }
                : undefined,
            approverComments: leaveRequest.approverComments,
            approvedAt: leaveRequest.approvedAt,
            rejectedAt: leaveRequest.rejectedAt,
            rejectionReason: leaveRequest.rejectionReason,
            modificationRequestReason: leaveRequest.modificationRequestReason,
            modifiedBy: leaveRequest.modifiedBy,
            modifier: leaveRequest.modifier
                ? {
                    id: leaveRequest.modifier.id,
                    firstName: leaveRequest.modifier.firstName,
                    lastName: leaveRequest.modifier.lastName,
                }
                : undefined,
            cancelledAt: leaveRequest.cancelledAt,
            cancellationReason: leaveRequest.cancellationReason,
            organizationId: leaveRequest.organizationId,
            createdAt: leaveRequest.createdAt,
            updatedAt: leaveRequest.updatedAt,
        };
    }

    private buildLeaveRequestListResponse(leaveRequest: LeaveRequest): LeaveRequestListResponseDto {
        return {
            id: leaveRequest.id,
            userId: leaveRequest.userId,
            user: leaveRequest.user
                ? {
                    id: leaveRequest.user.id,
                    firstName: leaveRequest.user.firstName,
                    lastName: leaveRequest.user.lastName,
                    email: leaveRequest.user.email,
                    department: leaveRequest.user.department,
                }
                : undefined,
            leaveTypeId: leaveRequest.leaveTypeId,
            leaveType: leaveRequest.leaveType
                ? {
                    id: leaveRequest.leaveType.id,
                    name: leaveRequest.leaveType.name,
                }
                : undefined,
            startDate: leaveRequest.startDate,
            endDate: leaveRequest.endDate,
            numberOfDays: leaveRequest.numberOfDays,
            reason: leaveRequest.reason,
            status: leaveRequest.status,
            approverId: leaveRequest.approverId,
            approver: leaveRequest.approver
                ? {
                    id: leaveRequest.approver.id,
                    firstName: leaveRequest.approver.firstName,
                    lastName: leaveRequest.approver.lastName,
                }
                : undefined,
            createdAt: leaveRequest.createdAt,
            updatedAt: leaveRequest.updatedAt,
        };
    }
}