import { LeaveRequestStatus, LeaveDuration } from '../../../database/entities/leave-request.entity';

export class LeaveRequestResponseDto {
    id: string;
    userId: string;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        department?: string;
        designation?: string;
    };
    leaveTypeId: string;
    leaveType?: {
        id: string;
        name: string;
        hasBalanceRestriction: boolean;
    };
    startDate: Date;
    endDate: Date;
    startDuration: LeaveDuration;
    endDuration: LeaveDuration;
    numberOfDays: number;
    reason: string;
    attachment?: string;
    status: LeaveRequestStatus;
    approverId?: string;
    approver?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    approverComments?: string;
    approvedAt?: Date;
    rejectedAt?: Date;
    rejectionReason?: string;
    modificationRequestReason?: string | null;
    modifiedBy?: string;
    modifier?: {
        id: string;
        firstName: string;
        lastName: string;
    };
    cancelledAt?: Date;
    cancellationReason?: string;
    organizationId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export class LeaveRequestListResponseDto {
    id: string;
    userId: string;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        department?: string;
    };
    leaveTypeId: string;
    leaveType?: {
        id: string;
        name: string;
    };
    startDate: Date;
    endDate: Date;
    numberOfDays: number;
    reason: string;
    status: LeaveRequestStatus;
    approverId?: string;
    approver?: {
        id: string;
        firstName: string;
        lastName: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

export class LeaveBalanceSummaryDto {
    leaveTypeId: string;
    leaveTypeName: string;
    totalAllocated: number;
    usedDays: number;
    pendingDays: number;
    carriedForwardDays: number;
    remainingDays: number;
    availableBalance: number;
}