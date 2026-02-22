import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { Organization } from './organization.entity';
import { LeaveBalance } from './leave-balance.entity';
import { Role } from '../../common/enums/role.enum';

export enum LeaveAccrualType {
    MONTHLY = 'monthly',
    YEARLY = 'yearly',
}

export enum LeaveTypeName {
    CASUAL_LEAVE = 'Casual Leave',
    MEDICAL_LEAVE = 'Medical Leave',
    LOSS_OF_PAY = 'Loss of Pay (LOP)',
    OPTIONAL_LEAVE = 'Optional Leave',
}

@Entity('leave_types')
export class LeaveType {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true, type: 'text' })
    description: string;

    @Column({ type: 'int' })
    annualAllocation: number;

    @Column({ default: false })
    carryForwardAllowed: boolean;

    @Column({ type: 'int', nullable: true })
    maxCarryForwardDays: number;

    @Column({ type: 'int', nullable: true })
    maxConsecutiveDays: number;

    @Column({ default: true })
    approvalRequired: boolean;

    @Column({
        type: 'enum',
        enum: LeaveAccrualType,
        default: LeaveAccrualType.YEARLY,
    })
    accrualType: LeaveAccrualType;

    @Column({
        type: 'simple-array',
        enum: Role,
        default: [Role.EMPLOYEE, Role.REPORTING_MANAGER, Role.HR_ADMIN],
    })
    applicableRoles: Role[];

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: false })
    isSystemDefault: boolean;

    // LOP has no balance restriction (BR-LEAVE-002)
    @Column({ default: false })
    hasBalanceRestriction: boolean;

    @Column({ nullable: true })
    organizationId: string;

    @ManyToOne(() => Organization, { nullable: true, eager: false })
    @JoinColumn({ name: 'organizationId' })
    organization: Organization;

    @OneToMany(() => LeaveBalance, (leaveBalance) => leaveBalance.leaveType)
    leaveBalances: LeaveBalance[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}