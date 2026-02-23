import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { LeaveType } from './leave-type.entity';

export enum LeaveRequestStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    CANCELLED = 'cancelled',
    MODIFICATION_REQUESTED = 'modification_requested',
}

export enum LeaveDuration {
    FULL_DAY = 'full_day',
    HALF_DAY_MORNING = 'half_day_morning',
    HALF_DAY_AFTERNOON = 'half_day_afternoon',
}

@Entity('leave_requests')
export class LeaveRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    leaveTypeId: string;

    @ManyToOne(() => LeaveType, { eager: true })
    @JoinColumn({ name: 'leaveTypeId' })
    leaveType: LeaveType;

    @Column({ type: 'date' })
    startDate: Date;

    @Column({ type: 'date' })
    endDate: Date;

    @Column({
        type: 'enum',
        enum: LeaveDuration,
        default: LeaveDuration.FULL_DAY,
    })
    startDuration: LeaveDuration;

    @Column({
        type: 'enum',
        enum: LeaveDuration,
        default: LeaveDuration.FULL_DAY,
    })
    endDuration: LeaveDuration;

    @Column({ type: 'int' })
    numberOfDays: number;

    @Column({ type: 'text' })
    reason: string;

    @Column({ nullable: true, type: 'text' })
    attachment: string;

    @Column({
        type: 'enum',
        enum: LeaveRequestStatus,
        default: LeaveRequestStatus.PENDING,
    })
    status: LeaveRequestStatus;

    @Column({ nullable: true })
    approverId: string;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'approverId' })
    approver: User;

    @Column({ nullable: true, type: 'text' })
    approverComments: string;

    @Column({ nullable: true, type: 'timestamp' })
    approvedAt: Date;

    @Column({ nullable: true, type: 'timestamp' })
    rejectedAt: Date;

    @Column({ nullable: true, type: 'text' })
    rejectionReason: string;

    @Column({ nullable: true, type: 'text' })
    modificationRequestReason: string | null;

    @Column({ nullable: true })
    modifiedBy: string;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'modifiedBy' })
    modifier: User;

    @Column({ nullable: true, type: 'timestamp' })
    cancelledAt: Date;

    @Column({ nullable: true, type: 'text' })
    cancellationReason: string;

    @Column({ nullable: true })
    organizationId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Check if leave request is pending
    get isPending(): boolean {
        return this.status === LeaveRequestStatus.PENDING;
    }

    // Check if leave request is approved
    get isApproved(): boolean {
        return this.status === LeaveRequestStatus.APPROVED;
    }

    // Check if leave request can be cancelled
    get canBeCancelled(): boolean {
        return this.status === LeaveRequestStatus.PENDING ||
            this.status === LeaveRequestStatus.MODIFICATION_REQUESTED;
    }

    // Check if leave request can be modified
    get canBeModified(): boolean {
        return this.status === LeaveRequestStatus.PENDING ||
            this.status === LeaveRequestStatus.MODIFICATION_REQUESTED;
    }
}