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

export enum AttendanceStatus {
    PRESENT = 'present',
    ABSENT = 'absent',
    LATE = 'late',
    HALF_DAY = 'half_day',
    ON_LEAVE = 'on_leave',
    HOLIDAY = 'holiday',
    WEEKEND = 'weekend',
}

export enum WorkMode {
    WFO = 'wfo', // Work From Office
    WFH = 'wfh', // Work From Home
    HYBRID = 'hybrid',
}

export enum RegularizationStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

@Entity('attendance')
export class Attendance {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'date' })
    date: Date;

    // Check-in/Check-out times
    @Column({ nullable: true, type: 'timestamp' })
    checkInTime: Date;

    @Column({ nullable: true, type: 'timestamp' })
    checkOutTime: Date;

    // Location details
    @Column({ nullable: true, type: 'varchar' })
    checkInLocation: string | null;

    @Column({ nullable: true, type: 'varchar' })
    checkOutLocation: string | null;

    @Column({ nullable: true, type: 'float' })
    checkInLatitude: number | null;

    @Column({ nullable: true, type: 'float' })
    checkInLongitude: number | null;

    @Column({ nullable: true, type: 'float' })
    checkOutLatitude: number | null;

    @Column({ nullable: true, type: 'float' })
    checkOutLongitude: number | null;

    // Work details
    @Column({
        type: 'enum',
        enum: WorkMode,
        nullable: true,
    })
    workMode: WorkMode;

    @Column({
        type: 'enum',
        enum: AttendanceStatus,
        default: AttendanceStatus.ABSENT,
    })
    status: AttendanceStatus;

    // Calculated fields
    @Column({ nullable: true, type: 'float' })
    workingHours: number | null; // in hours

    @Column({ nullable: true, type: 'float' })
    overtimeHours: number | null; // in hours

    @Column({ default: false })
    isLate: boolean;

    @Column({ nullable: true, type: 'int' })
    lateByMinutes: number | null;

    @Column({ default: false })
    isEarlyCheckout: boolean;

    @Column({ nullable: true, type: 'int' })
    earlyCheckoutByMinutes: number | null;

    // Regularization fields
    @Column({ default: false })
    isRegularized: boolean;

    @Column({
        type: 'enum',
        enum: RegularizationStatus,
        nullable: true,
    })
    regularizationStatus: RegularizationStatus;

    @Column({ nullable: true, type: 'text' })
    regularizationReason: string;

    @Column({ nullable: true })
    regularizedBy: string;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'regularizedBy' })
    regularizer: User;

    @Column({ nullable: true, type: 'timestamp' })
    regularizedAt: Date;

    @Column({ nullable: true, type: 'text' })
    regularizationComments: string | null;

    // Notes and remarks
    @Column({ nullable: true, type: 'text' })
    notes: string | null;

    @Column({ nullable: true })
    organizationId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Virtual getters
    get isCheckedIn(): boolean {
        return !!this.checkInTime;
    }

    get isCheckedOut(): boolean {
        return !!this.checkOutTime;
    }

    get isPresent(): boolean {
        return this.status === AttendanceStatus.PRESENT ||
            this.status === AttendanceStatus.LATE ||
            this.status === AttendanceStatus.HALF_DAY;
    }

    // Calculate working hours
    calculateWorkingHours(): number {
        if (!this.checkInTime || !this.checkOutTime) {
            return 0;
        }
        const diffMs = this.checkOutTime.getTime() - this.checkInTime.getTime();
        return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
    }
}