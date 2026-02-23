import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { Attendance } from '../../database/entities/attendance.entity';
import { User } from '../../database/entities/user.entity';
import { Holiday } from '../../database/entities/holiday.entity';
import { LeaveRequest } from '../../database/entities/leave-request.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Attendance, User, Holiday, LeaveRequest]),
    ],
    controllers: [AttendanceController],
    providers: [AttendanceService],
    exports: [AttendanceService],
})
export class AttendanceModule { }