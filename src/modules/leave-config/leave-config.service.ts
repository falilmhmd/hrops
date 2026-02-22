import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { LeaveType, LeaveTypeName, LeaveAccrualType } from '../../database/entities/leave-type.entity';
import { LeaveBalance } from '../../database/entities/leave-balance.entity';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../common/enums/role.enum';
import {
    CreateLeaveTypeDto,
    UpdateLeaveTypeDto,
    LeaveTypeResponseDto,
    LeaveBalanceResponseDto,
    AssignLeaveTypeDto,
    BulkAssignLeaveTypesDto,
} from './dto';

@Injectable()
export class LeaveConfigService {
    constructor(
        @InjectRepository(LeaveType)
        private leaveTypeRepository: Repository<LeaveType>,
        @InjectRepository(LeaveBalance)
        private leaveBalanceRepository: Repository<LeaveBalance>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private dataSource: DataSource,
    ) { }

    // ==================== LEAVE TYPE CRUD ====================

    async createLeaveType(createDto: CreateLeaveTypeDto): Promise<LeaveTypeResponseDto> {
        // Check if leave type with same name already exists
        const existingLeaveType = await this.leaveTypeRepository.findOne({
            where: { name: createDto.name },
        });
        if (existingLeaveType) {
            throw new BadRequestException('Leave type with this name already exists');
        }

        // Validate carry forward configuration (BR-LEAVE-003)
        if (createDto.carryForwardAllowed && createDto.maxCarryForwardDays === undefined) {
            throw new BadRequestException('Max carry forward days is required when carry forward is allowed');
        }

        const leaveType = this.leaveTypeRepository.create({
            ...createDto,
            hasBalanceRestriction: createDto.hasBalanceRestriction ?? true,
            isActive: true,
        });

        const savedLeaveType = await this.leaveTypeRepository.save(leaveType);
        return this.buildLeaveTypeResponse(savedLeaveType);
    }

    async updateLeaveType(id: string, updateDto: UpdateLeaveTypeDto): Promise<LeaveTypeResponseDto> {
        const leaveType = await this.leaveTypeRepository.findOne({ where: { id } });
        if (!leaveType) {
            throw new NotFoundException('Leave type not found');
        }

        // Check for name uniqueness if name is being updated
        if (updateDto.name && updateDto.name !== leaveType.name) {
            const existingLeaveType = await this.leaveTypeRepository.findOne({
                where: { name: updateDto.name },
            });
            if (existingLeaveType) {
                throw new BadRequestException('Leave type with this name already exists');
            }
        }

        // Validate carry forward configuration (BR-LEAVE-003)
        if (updateDto.carryForwardAllowed === true && updateDto.maxCarryForwardDays === undefined && leaveType.maxCarryForwardDays === undefined) {
            throw new BadRequestException('Max carry forward days is required when carry forward is allowed');
        }

        Object.assign(leaveType, updateDto);
        const updatedLeaveType = await this.leaveTypeRepository.save(leaveType);
        return this.buildLeaveTypeResponse(updatedLeaveType);
    }

    async deleteLeaveType(id: string): Promise<void> {
        const leaveType = await this.leaveTypeRepository.findOne({ where: { id } });
        if (!leaveType) {
            throw new NotFoundException('Leave type not found');
        }

        // Soft delete by setting isActive to false
        leaveType.isActive = false;
        await this.leaveTypeRepository.save(leaveType);
    }

    async findAllLeaveTypes(includeInactive = false): Promise<LeaveTypeResponseDto[]> {
        const queryBuilder = this.leaveTypeRepository.createQueryBuilder('leaveType');

        if (!includeInactive) {
            queryBuilder.where('leaveType.isActive = :isActive', { isActive: true });
        }

        const leaveTypes = await queryBuilder.getMany();
        return leaveTypes.map((lt) => this.buildLeaveTypeResponse(lt));
    }

    async findLeaveTypeById(id: string): Promise<LeaveTypeResponseDto> {
        const leaveType = await this.leaveTypeRepository.findOne({ where: { id } });
        if (!leaveType) {
            throw new NotFoundException('Leave type not found');
        }
        return this.buildLeaveTypeResponse(leaveType);
    }

    async findLeaveTypesByRole(role: Role): Promise<LeaveTypeResponseDto[]> {
        const leaveTypes = await this.leaveTypeRepository
            .createQueryBuilder('leaveType')
            .where('leaveType.isActive = :isActive', { isActive: true })
            .andWhere(':role = ANY(leaveType.applicableRoles)', { role })
            .getMany();

        return leaveTypes.map((lt) => this.buildLeaveTypeResponse(lt));
    }

    // ==================== LEAVE BALANCE MANAGEMENT ====================

    async assignLeaveTypeToUsers(
        leaveTypeId: string,
        assignDto: AssignLeaveTypeDto,
    ): Promise<LeaveBalanceResponseDto[]> {
        const leaveType = await this.leaveTypeRepository.findOne({ where: { id: leaveTypeId } });
        if (!leaveType) {
            throw new NotFoundException('Leave type not found');
        }

        const users = await this.userRepository.find({
            where: { id: In(assignDto.userIds), isActive: true, isDeleted: false },
        });

        if (users.length === 0) {
            throw new BadRequestException('No valid users found');
        }

        // Filter users by applicable roles
        const validUsers = users.filter((user) => leaveType.applicableRoles.includes(user.role));

        if (validUsers.length === 0) {
            throw new BadRequestException('No users match the applicable roles for this leave type');
        }

        const currentYear = new Date().getFullYear();
        const balances: LeaveBalance[] = [];

        for (const user of validUsers) {
            // Check if balance already exists
            const existingBalance = await this.leaveBalanceRepository.findOne({
                where: {
                    userId: user.id,
                    leaveTypeId: leaveType.id,
                    year: currentYear,
                },
            });

            if (existingBalance) {
                continue; // Skip if already assigned
            }

            const balance = this.leaveBalanceRepository.create({
                userId: user.id,
                leaveTypeId: leaveType.id,
                totalAllocated: leaveType.annualAllocation,
                usedDays: 0,
                pendingDays: 0,
                carriedForwardDays: 0,
                remainingDays: leaveType.annualAllocation,
                year: currentYear,
                organizationId: assignDto.organizationId || leaveType.organizationId,
            });
            balances.push(balance);
        }

        const savedBalances = await this.leaveBalanceRepository.save(balances);
        return savedBalances.map((b) => this.buildLeaveBalanceResponse(b));
    }

    async bulkAssignLeaveTypes(assignDto: BulkAssignLeaveTypesDto): Promise<LeaveBalanceResponseDto[]> {
        const leaveTypes = await this.leaveTypeRepository.find({
            where: { id: In(assignDto.leaveTypeIds), isActive: true },
        });

        if (leaveTypes.length === 0) {
            throw new NotFoundException('No valid leave types found');
        }

        const users = await this.userRepository.find({
            where: { id: In(assignDto.userIds), isActive: true, isDeleted: false },
        });

        if (users.length === 0) {
            throw new BadRequestException('No valid users found');
        }

        const currentYear = new Date().getFullYear();
        const balances: LeaveBalance[] = [];

        for (const leaveType of leaveTypes) {
            const validUsers = users.filter((user) => leaveType.applicableRoles.includes(user.role));

            for (const user of validUsers) {
                const existingBalance = await this.leaveBalanceRepository.findOne({
                    where: {
                        userId: user.id,
                        leaveTypeId: leaveType.id,
                        year: currentYear,
                    },
                });

                if (existingBalance) {
                    continue;
                }

                const balance = this.leaveBalanceRepository.create({
                    userId: user.id,
                    leaveTypeId: leaveType.id,
                    totalAllocated: leaveType.annualAllocation,
                    usedDays: 0,
                    pendingDays: 0,
                    carriedForwardDays: 0,
                    remainingDays: leaveType.annualAllocation,
                    year: currentYear,
                    organizationId: assignDto.organizationId || leaveType.organizationId,
                });
                balances.push(balance);
            }
        }

        const savedBalances = await this.leaveBalanceRepository.save(balances);
        return savedBalances.map((b) => this.buildLeaveBalanceResponse(b));
    }

    async getUserLeaveBalances(userId: string, year?: number): Promise<LeaveBalanceResponseDto[]> {
        const currentYear = year || new Date().getFullYear();

        const balances = await this.leaveBalanceRepository.find({
            where: { userId, year: currentYear },
            relations: ['leaveType'],
        });

        return balances.map((b) => this.buildLeaveBalanceResponse(b));
    }

    async getUserLeaveBalanceByType(
        userId: string,
        leaveTypeId: string,
        year?: number,
    ): Promise<LeaveBalanceResponseDto> {
        const currentYear = year || new Date().getFullYear();

        const balance = await this.leaveBalanceRepository.findOne({
            where: { userId, leaveTypeId, year: currentYear },
            relations: ['leaveType'],
        });

        if (!balance) {
            throw new NotFoundException('Leave balance not found');
        }

        return this.buildLeaveBalanceResponse(balance);
    }

    // ==================== SYSTEM DEFAULT LEAVE TYPES ====================

    async createDefaultLeaveTypes(organizationId?: string): Promise<LeaveTypeResponseDto[]> {
        const defaultLeaveTypes: Partial<LeaveType>[] = [
            {
                name: LeaveTypeName.CASUAL_LEAVE,
                description: 'Casual leave for personal matters',
                annualAllocation: 12,
                carryForwardAllowed: true,
                maxCarryForwardDays: 6,
                maxConsecutiveDays: 5,
                approvalRequired: true,
                accrualType: LeaveAccrualType.MONTHLY,
                applicableRoles: [Role.EMPLOYEE, Role.REPORTING_MANAGER, Role.HR_ADMIN],
                isSystemDefault: true,
                hasBalanceRestriction: true,
                organizationId,
            },
            {
                name: LeaveTypeName.MEDICAL_LEAVE,
                description: 'Medical leave for health-related issues',
                annualAllocation: 15,
                carryForwardAllowed: false,
                maxConsecutiveDays: 30,
                approvalRequired: true,
                accrualType: LeaveAccrualType.YEARLY,
                applicableRoles: [Role.EMPLOYEE, Role.REPORTING_MANAGER, Role.HR_ADMIN],
                isSystemDefault: true,
                hasBalanceRestriction: true,
                organizationId,
            },
            {
                name: LeaveTypeName.LOSS_OF_PAY,
                description: 'Loss of Pay leave - no balance restriction',
                annualAllocation: 0,
                carryForwardAllowed: false,
                approvalRequired: true,
                accrualType: LeaveAccrualType.YEARLY,
                applicableRoles: [Role.EMPLOYEE, Role.REPORTING_MANAGER, Role.HR_ADMIN],
                isSystemDefault: true,
                hasBalanceRestriction: false, // BR-LEAVE-002: LOP has no balance restriction
                organizationId,
            },
            {
                name: LeaveTypeName.OPTIONAL_LEAVE,
                description: 'Optional leave for special occasions',
                annualAllocation: 5,
                carryForwardAllowed: false,
                maxConsecutiveDays: 3,
                approvalRequired: true,
                accrualType: LeaveAccrualType.YEARLY,
                applicableRoles: [Role.EMPLOYEE, Role.REPORTING_MANAGER, Role.HR_ADMIN],
                isSystemDefault: true,
                hasBalanceRestriction: true,
                organizationId,
            },
        ];

        const createdLeaveTypes: LeaveType[] = [];

        for (const defaultType of defaultLeaveTypes) {
            const existing = await this.leaveTypeRepository.findOne({
                where: { name: defaultType.name },
            });

            if (!existing) {
                const leaveType = this.leaveTypeRepository.create(defaultType);
                const saved = await this.leaveTypeRepository.save(leaveType);
                createdLeaveTypes.push(saved);
            }
        }

        return createdLeaveTypes.map((lt) => this.buildLeaveTypeResponse(lt));
    }

    // ==================== LEAVE ACCRUAL (BR-LEAVE-001) ====================

    async processMonthlyAccrual(): Promise<void> {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        // Get all leave types with monthly accrual
        const monthlyLeaveTypes = await this.leaveTypeRepository.find({
            where: {
                accrualType: LeaveAccrualType.MONTHLY,
                isActive: true,
            },
        });

        for (const leaveType of monthlyLeaveTypes) {
            const monthlyAllocation = Math.floor(leaveType.annualAllocation / 12);

            // Get all balances for this leave type
            const balances = await this.leaveBalanceRepository.find({
                where: { leaveTypeId: leaveType.id, year: currentYear },
            });

            for (const balance of balances) {
                // Add monthly allocation
                balance.totalAllocated += monthlyAllocation;
                balance.remainingDays += monthlyAllocation;
                await this.leaveBalanceRepository.save(balance);
            }
        }
    }

    async processYearEndCarryForward(): Promise<void> {
        const previousYear = new Date().getFullYear() - 1;
        const currentYear = new Date().getFullYear();

        // Get all leave types that allow carry forward
        const carryForwardLeaveTypes = await this.leaveTypeRepository.find({
            where: {
                carryForwardAllowed: true,
                isActive: true,
            },
        });

        for (const leaveType of carryForwardLeaveTypes) {
            // Get all balances for previous year
            const previousBalances = await this.leaveBalanceRepository.find({
                where: { leaveTypeId: leaveType.id, year: previousYear },
            });

            for (const prevBalance of previousBalances) {
                const remainingDays = prevBalance.totalAllocated + prevBalance.carriedForwardDays - prevBalance.usedDays;

                if (remainingDays > 0) {
                    // Apply carry forward limit (BR-LEAVE-003)
                    const carryForwardDays = leaveType.maxCarryForwardDays
                        ? Math.min(remainingDays, leaveType.maxCarryForwardDays)
                        : remainingDays;

                    // Check if current year balance exists
                    let currentBalance = await this.leaveBalanceRepository.findOne({
                        where: {
                            userId: prevBalance.userId,
                            leaveTypeId: leaveType.id,
                            year: currentYear,
                        },
                    });

                    if (!currentBalance) {
                        currentBalance = this.leaveBalanceRepository.create({
                            userId: prevBalance.userId,
                            leaveTypeId: leaveType.id,
                            totalAllocated: leaveType.annualAllocation,
                            usedDays: 0,
                            pendingDays: 0,
                            year: currentYear,
                            organizationId: prevBalance.organizationId,
                        });
                    }

                    currentBalance.carriedForwardDays = carryForwardDays;
                    currentBalance.remainingDays = currentBalance.totalAllocated + carryForwardDays - currentBalance.usedDays - currentBalance.pendingDays;

                    await this.leaveBalanceRepository.save(currentBalance);
                }
            }
        }
    }

    // ==================== HELPER METHODS ====================

    private buildLeaveTypeResponse(leaveType: LeaveType): LeaveTypeResponseDto {
        return {
            id: leaveType.id,
            name: leaveType.name,
            description: leaveType.description,
            annualAllocation: leaveType.annualAllocation,
            carryForwardAllowed: leaveType.carryForwardAllowed,
            maxCarryForwardDays: leaveType.maxCarryForwardDays,
            maxConsecutiveDays: leaveType.maxConsecutiveDays,
            approvalRequired: leaveType.approvalRequired,
            accrualType: leaveType.accrualType,
            applicableRoles: leaveType.applicableRoles,
            isActive: leaveType.isActive,
            isSystemDefault: leaveType.isSystemDefault,
            hasBalanceRestriction: leaveType.hasBalanceRestriction,
            organizationId: leaveType.organizationId,
            createdAt: leaveType.createdAt,
            updatedAt: leaveType.updatedAt,
        };
    }

    private buildLeaveBalanceResponse(balance: LeaveBalance): LeaveBalanceResponseDto {
        return {
            id: balance.id,
            userId: balance.userId,
            leaveTypeId: balance.leaveTypeId,
            leaveType: balance.leaveType ? this.buildLeaveTypeResponse(balance.leaveType) : undefined,
            totalAllocated: balance.totalAllocated,
            usedDays: balance.usedDays,
            pendingDays: balance.pendingDays,
            carriedForwardDays: balance.carriedForwardDays,
            remainingDays: balance.remainingDays,
            availableBalance: balance.availableBalance,
            year: balance.year,
            organizationId: balance.organizationId,
            createdAt: balance.createdAt,
            updatedAt: balance.updatedAt,
        };
    }
}