import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveConfigController } from './leave-config.controller';
import { LeaveConfigService } from './leave-config.service';
import { LeaveType } from '../../database/entities/leave-type.entity';
import { LeaveBalance } from '../../database/entities/leave-balance.entity';
import { User } from '../../database/entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([LeaveType, LeaveBalance, User])],
    controllers: [LeaveConfigController],
    providers: [LeaveConfigService],
    exports: [LeaveConfigService],
})
export class LeaveConfigModule { }