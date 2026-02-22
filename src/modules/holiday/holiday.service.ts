import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Holiday, HolidayType } from '../../database/entities/holiday.entity';
import {
    CreateHolidayDto,
    UpdateHolidayDto,
    HolidayResponseDto,
    HolidayListResponseDto,
} from './dto';

@Injectable()
export class HolidayService {
    constructor(
        @InjectRepository(Holiday)
        private holidayRepository: Repository<Holiday>,
    ) { }

    // ==================== HOLIDAY CRUD ====================

    async createHoliday(createDto: CreateHolidayDto): Promise<HolidayResponseDto> {
        // Parse the date
        const holidayDate = new Date(createDto.date);

        // Check if holiday with same name and date already exists
        const existingHoliday = await this.holidayRepository.findOne({
            where: {
                name: createDto.name,
                date: holidayDate,
            },
        });

        if (existingHoliday) {
            throw new BadRequestException('Holiday with this name and date already exists');
        }

        const holiday = this.holidayRepository.create({
            ...createDto,
            date: holidayDate,
            type: createDto.type || HolidayType.PUBLIC,
            isRecurring: createDto.isRecurring ?? true,
            isActive: true,
        });

        const savedHoliday = await this.holidayRepository.save(holiday);
        return this.buildHolidayResponse(savedHoliday);
    }

    async updateHoliday(id: string, updateDto: UpdateHolidayDto): Promise<HolidayResponseDto> {
        const holiday = await this.holidayRepository.findOne({ where: { id } });
        if (!holiday) {
            throw new NotFoundException('Holiday not found');
        }

        // Check for name uniqueness if name is being updated
        if (updateDto.name && updateDto.name !== holiday.name) {
            const dateToCheck = updateDto.date ? new Date(updateDto.date) : holiday.date;
            const existingHoliday = await this.holidayRepository.findOne({
                where: {
                    name: updateDto.name,
                    date: dateToCheck,
                },
            });
            if (existingHoliday && existingHoliday.id !== id) {
                throw new BadRequestException('Holiday with this name and date already exists');
            }
        }

        // Update fields
        if (updateDto.name) holiday.name = updateDto.name;
        if (updateDto.description !== undefined) holiday.description = updateDto.description;
        if (updateDto.date) holiday.date = new Date(updateDto.date);
        if (updateDto.type) holiday.type = updateDto.type;
        if (updateDto.location !== undefined) holiday.location = updateDto.location;
        if (updateDto.locations !== undefined) holiday.locations = updateDto.locations;
        if (updateDto.isRecurring !== undefined) holiday.isRecurring = updateDto.isRecurring;
        if (updateDto.isActive !== undefined) holiday.isActive = updateDto.isActive;
        if (updateDto.organizationId !== undefined) holiday.organizationId = updateDto.organizationId;

        const updatedHoliday = await this.holidayRepository.save(holiday);
        return this.buildHolidayResponse(updatedHoliday);
    }

    async deleteHoliday(id: string): Promise<void> {
        const holiday = await this.holidayRepository.findOne({ where: { id } });
        if (!holiday) {
            throw new NotFoundException('Holiday not found');
        }

        // Soft delete by setting isActive to false
        holiday.isActive = false;
        await this.holidayRepository.save(holiday);
    }

    async findAllHolidays(
        includeInactive = false,
        year?: number,
        type?: HolidayType,
        location?: string,
    ): Promise<HolidayListResponseDto> {
        const queryBuilder = this.holidayRepository.createQueryBuilder('holiday');

        if (!includeInactive) {
            queryBuilder.where('holiday.isActive = :isActive', { isActive: true });
        }

        if (year) {
            queryBuilder.andWhere('EXTRACT(YEAR FROM holiday.date) = :year', { year });
        }

        if (type) {
            queryBuilder.andWhere('holiday.type = :type', { type });
        }

        if (location) {
            queryBuilder.andWhere(
                '(holiday.location = :location OR :location = ANY(holiday.locations))',
                { location },
            );
        }

        queryBuilder.orderBy('holiday.date', 'ASC');

        const [data, total] = await queryBuilder.getManyAndCount();
        return {
            data: data.map((h) => this.buildHolidayResponse(h)),
            total,
        };
    }

    async findHolidayById(id: string): Promise<HolidayResponseDto> {
        const holiday = await this.holidayRepository.findOne({ where: { id } });
        if (!holiday) {
            throw new NotFoundException('Holiday not found');
        }
        return this.buildHolidayResponse(holiday);
    }

    async findHolidaysByDateRange(
        startDate: Date,
        endDate: Date,
        location?: string,
    ): Promise<HolidayResponseDto[]> {
        const queryBuilder = this.holidayRepository
            .createQueryBuilder('holiday')
            .where('holiday.date BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere('holiday.isActive = :isActive', { isActive: true })
            .orderBy('holiday.date', 'ASC');

        if (location) {
            queryBuilder.andWhere(
                '(holiday.location = :location OR :location = ANY(holiday.locations) OR holiday.location IS NULL)',
                { location },
            );
        }

        const holidays = await queryBuilder.getMany();
        return holidays.map((h) => this.buildHolidayResponse(h));
    }

    async findHolidaysByLocation(location: string, year?: number): Promise<HolidayResponseDto[]> {
        const queryBuilder = this.holidayRepository
            .createQueryBuilder('holiday')
            .where('holiday.isActive = :isActive', { isActive: true })
            .andWhere(
                '(holiday.location = :location OR :location = ANY(holiday.locations) OR holiday.location IS NULL)',
                { location },
            )
            .orderBy('holiday.date', 'ASC');

        if (year) {
            queryBuilder.andWhere('EXTRACT(YEAR FROM holiday.date) = :year', { year });
        }

        const holidays = await queryBuilder.getMany();
        return holidays.map((h) => this.buildHolidayResponse(h));
    }

    async findPublicHolidays(year?: number): Promise<HolidayResponseDto[]> {
        const queryBuilder = this.holidayRepository
            .createQueryBuilder('holiday')
            .where('holiday.type = :type', { type: HolidayType.PUBLIC })
            .andWhere('holiday.isActive = :isActive', { isActive: true })
            .orderBy('holiday.date', 'ASC');

        if (year) {
            queryBuilder.andWhere('EXTRACT(YEAR FROM holiday.date) = :year', { year });
        }

        const holidays = await queryBuilder.getMany();
        return holidays.map((h) => this.buildHolidayResponse(h));
    }

    async findOptionalHolidays(year?: number): Promise<HolidayResponseDto[]> {
        const queryBuilder = this.holidayRepository
            .createQueryBuilder('holiday')
            .where('holiday.type = :type', { type: HolidayType.OPTIONAL })
            .andWhere('holiday.isActive = :isActive', { isActive: true })
            .orderBy('holiday.date', 'ASC');

        if (year) {
            queryBuilder.andWhere('EXTRACT(YEAR FROM holiday.date) = :year', { year });
        }

        const holidays = await queryBuilder.getMany();
        return holidays.map((h) => this.buildHolidayResponse(h));
    }

    // ==================== HELPER METHODS ====================

    private buildHolidayResponse(holiday: Holiday): HolidayResponseDto {
        return {
            id: holiday.id,
            name: holiday.name,
            description: holiday.description,
            date: holiday.date,
            type: holiday.type,
            location: holiday.location,
            locations: holiday.locations,
            isRecurring: holiday.isRecurring,
            isActive: holiday.isActive,
            organizationId: holiday.organizationId,
            createdAt: holiday.createdAt,
            updatedAt: holiday.updatedAt,
        };
    }
}