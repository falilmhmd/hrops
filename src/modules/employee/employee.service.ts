import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeFilterDto } from './dto/employee-filter.dto';
import { EmployeeSearchDto } from './dto/employee-search.dto';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { MailService } from '../mail/mail.service';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class EmployeeService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private mailService: MailService,
    ) { }

    async createEmployee(createEmployeeDto: CreateEmployeeDto): Promise<EmployeeResponseDto> {
        // Check if email already exists (BR-EMP-ADMIN-001)
        const existingUser = await this.userRepository.findOne({
            where: { email: createEmployeeDto.email },
        });
        if (existingUser) {
            throw new BadRequestException('Email already exists');
        }

        // Check for circular reporting (BR-EMP-ADMIN-003)
        if (createEmployeeDto.reportingManagerId) {
            const manager = await this.userRepository.findOne({
                where: { id: createEmployeeDto.reportingManagerId },
            });
            if (!manager) {
                throw new BadRequestException('Reporting manager not found');
            }
            // Check if manager is the same as employee
            if (manager.id === createEmployeeDto.email) {
                throw new BadRequestException('Cannot report to yourself');
            }
        }

        // Create user with employee role
        const user = this.userRepository.create({
            ...createEmployeeDto,
            role: createEmployeeDto.role || Role.EMPLOYEE,
            isActive: true,
            isDeleted: false,
        });

        // Generate login credentials
        const password = this.generateRandomPassword();
        user.password = password;

        // Save user
        const savedUser = await this.userRepository.save(user);

        // Send invitation email
        await this.mailService.sendInvitationEmail(
            savedUser.email,
            savedUser.firstName,
            password,
        );

        return this.buildEmployeeResponse(savedUser);
    }

    async updateEmployee(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<EmployeeResponseDto> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('Employee not found');
        }

        // Check for circular reporting if reporting manager is being updated
        if (updateEmployeeDto.reportingManagerId) {
            const manager = await this.userRepository.findOne({
                where: { id: updateEmployeeDto.reportingManagerId },
            });
            if (!manager) {
                throw new BadRequestException('Reporting manager not found');
            }
            // Check if manager is the same as employee
            if (manager.id === id) {
                throw new BadRequestException('Cannot report to yourself');
            }
        }

        Object.assign(user, updateEmployeeDto);
        const updatedUser = await this.userRepository.save(user);

        return this.buildEmployeeResponse(updatedUser);
    }

    async deleteEmployee(id: string): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('Employee not found');
        }

        // Soft delete (BR-EMP-ADMIN-004)
        user.isDeleted = true;
        user.deletedAt = new Date();
        user.isActive = false;
        await this.userRepository.save(user);
    }

    async findAll(filterDto?: EmployeeFilterDto): Promise<EmployeeResponseDto[]> {
        const queryBuilder = this.userRepository.createQueryBuilder('user');

        // Apply filters
        if (filterDto?.role) {
            queryBuilder.andWhere('user.role = :role', { role: filterDto.role });
        }
        if (filterDto?.roles) {
            queryBuilder.andWhere('user.role IN (:...roles)', { roles: filterDto.roles });
        }
        if (filterDto?.department) {
            queryBuilder.andWhere('user.department = :department', { department: filterDto.department });
        }
        if (filterDto?.employmentType) {
            queryBuilder.andWhere('user.employmentType = :employmentType', { employmentType: filterDto.employmentType });
        }
        if (filterDto?.isActive !== undefined) {
            queryBuilder.andWhere('user.isActive = :isActive', { isActive: filterDto.isActive });
        }
        if (filterDto?.isDeleted !== undefined) {
            queryBuilder.andWhere('user.isDeleted = :isDeleted', { isDeleted: filterDto.isDeleted });
        }

        const users = await queryBuilder.getMany();
        return users.map(user => this.buildEmployeeResponse(user));
    }

    async searchEmployees(searchDto: EmployeeSearchDto): Promise<EmployeeResponseDto[]> {
        const queryBuilder = this.userRepository.createQueryBuilder('user');

        // Apply search criteria
        if (searchDto.search) {
            queryBuilder.andWhere(
                'user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search',
                { search: `%${searchDto.search}%` },
            );
        }
        if (searchDto.firstName) {
            queryBuilder.andWhere('user.firstName LIKE :firstName', { firstName: `%${searchDto.firstName}%` });
        }
        if (searchDto.lastName) {
            queryBuilder.andWhere('user.lastName LIKE :lastName', { lastName: `%${searchDto.lastName}%` });
        }
        if (searchDto.email) {
            queryBuilder.andWhere('user.email LIKE :email', { email: `%${searchDto.email}%` });
        }
        if (searchDto.department) {
            queryBuilder.andWhere('user.department LIKE :department', { department: `%${searchDto.department}%` });
        }
        if (searchDto.designation) {
            queryBuilder.andWhere('user.designation LIKE :designation', { designation: `%${searchDto.designation}%` });
        }

        const users = await queryBuilder.getMany();
        return users.map(user => this.buildEmployeeResponse(user));
    }

    async findOne(id: string): Promise<EmployeeResponseDto> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('Employee not found');
        }
        return this.buildEmployeeResponse(user);
    }

    private buildEmployeeResponse(user: User): EmployeeResponseDto {
        return {
            // Personal Information
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            mobileNumber: user.mobileNumber,
            email: user.email,
            dateOfBirth: user.dateOfBirth,
            maritalStatus: user.maritalStatus,
            gender: user.gender,
            nationality: user.nationality,
            city: user.city,
            state: user.state,
            zipcode: user.zipcode,
            // Professional Information
            employeeId: user.employeeId,
            username: user.username,
            employmentType: user.employmentType,
            officialEmail: user.officialEmail,
            department: user.department,
            designation: user.designation,
            workingDays: user.workingDays,
            dateOfJoining: user.dateOfJoining,
            officeLocation: user.officeLocation,
            reportingManagerId: user.reportingManagerId,
            role: user.role,
            // Documents
            appointmentLetter: user.appointmentLetter,
            salarySlips: user.salarySlips,
            relievingLetter: user.relievingLetter,
            experienceLetter: user.experienceLetter,
            certificateLetter: user.certificateLetter,
            // Account Access
            slackId: user.slackId,
            skypeId: user.skypeId,
            githubId: user.githubId,
            // System Fields
            isActive: user.isActive,
            isDeleted: user.isDeleted,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    private generateRandomPassword(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
}