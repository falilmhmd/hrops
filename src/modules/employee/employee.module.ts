import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';
import { User } from '../../database/entities/user.entity';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        MailModule,
    ],
    controllers: [EmployeeController],
    providers: [EmployeeService],
    exports: [EmployeeService],
})
export class EmployeeModule { }