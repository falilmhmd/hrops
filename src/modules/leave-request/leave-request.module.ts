import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveRequestController } from './leave-request.controller';
import { LeaveRequestService } from './leave-request.service';
import { LeaveRequest } from '../../database/entities/leave-request.entity';
import { LeaveBalance } from '../../database/entities/leave-balance.entity';
import { LeaveType } from '../../database/entities/leave-type.entity';
import { User } from '../../database/entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([LeaveRequest, LeaveBalance, LeaveType, User]),
    ],
    controllers: [LeaveRequestController],
    providers: [LeaveRequestService],
    exports: [LeaveRequestService],
})
export class LeaveRequestModule { }