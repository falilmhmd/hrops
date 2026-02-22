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

@Entity('leave_balances')
export class LeaveBalance {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    leaveTypeId: string;

    @ManyToOne(() => LeaveType, (leaveType) => leaveType.leaveBalances, { eager: true })
    @JoinColumn({ name: 'leaveTypeId' })
    leaveType: LeaveType;

    @Column({ type: 'int', default: 0 })
    totalAllocated: number;

    @Column({ type: 'int', default: 0 })
    usedDays: number;

    @Column({ type: 'int', default: 0 })
    pendingDays: number;

    @Column({ type: 'int', default: 0 })
    carriedForwardDays: number;

    @Column({ type: 'int', default: 0 })
    remainingDays: number;

    @Column({ type: 'int' })
    year: number;

    @Column({ nullable: true })
    organizationId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Calculate remaining days
    get availableBalance(): number {
        return this.totalAllocated + this.carriedForwardDays - this.usedDays - this.pendingDays;
    }
}