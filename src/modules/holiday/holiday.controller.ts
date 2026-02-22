import {
    Controller,
    Post,
    Put,
    Delete,
    Get,
    Body,
    Param,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { HolidayService } from './holiday.service';
import { HolidayType } from '../../database/entities/holiday.entity';
import {
    CreateHolidayDto,
    UpdateHolidayDto,
    HolidayResponseDto,
    HolidayListResponseDto,
} from './dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Holiday Calendar')
@Controller('holidays')
export class HolidayController {
    constructor(private readonly holidayService: HolidayService) { }

    // ==================== HOLIDAY CRUD ENDPOINTS ====================

    @Post()
    @Roles(Role.HR_ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Create a new holiday' })
    @ApiResponse({ status: 201, description: 'Holiday created successfully', type: HolidayResponseDto })
    async createHoliday(@Body() createDto: CreateHolidayDto): Promise<HolidayResponseDto> {
        return this.holidayService.createHoliday(createDto);
    }

    @Put(':id')
    @Roles(Role.HR_ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update an existing holiday' })
    @ApiParam({ name: 'id', description: 'Holiday ID' })
    @ApiResponse({ status: 200, description: 'Holiday updated successfully', type: HolidayResponseDto })
    async updateHoliday(
        @Param('id') id: string,
        @Body() updateDto: UpdateHolidayDto,
    ): Promise<HolidayResponseDto> {
        return this.holidayService.updateHoliday(id, updateDto);
    }

    @Delete(':id')
    @Roles(Role.HR_ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Delete a holiday (soft delete)' })
    @ApiParam({ name: 'id', description: 'Holiday ID' })
    @ApiResponse({ status: 204, description: 'Holiday deleted successfully' })
    async deleteHoliday(@Param('id') id: string): Promise<void> {
        return this.holidayService.deleteHoliday(id);
    }

    @Get()
    @ApiOperation({ summary: 'Get all holidays' })
    @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
    @ApiQuery({ name: 'year', required: false, type: Number })
    @ApiQuery({ name: 'type', required: false, enum: HolidayType })
    @ApiQuery({ name: 'location', required: false, type: String })
    @ApiResponse({ status: 200, description: 'Holidays retrieved successfully', type: HolidayListResponseDto })
    async findAllHolidays(
        @Query('includeInactive') includeInactive?: boolean,
        @Query('year') year?: number,
        @Query('type') type?: HolidayType,
        @Query('location') location?: string,
    ): Promise<HolidayListResponseDto> {
        return this.holidayService.findAllHolidays(includeInactive, year, type, location);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get holiday by ID' })
    @ApiParam({ name: 'id', description: 'Holiday ID' })
    @ApiResponse({ status: 200, description: 'Holiday retrieved successfully', type: HolidayResponseDto })
    async findHolidayById(@Param('id') id: string): Promise<HolidayResponseDto> {
        return this.holidayService.findHolidayById(id);
    }

    // ==================== HOLIDAY FILTER ENDPOINTS ====================

    @Get('public/list')
    @ApiOperation({ summary: 'Get all public holidays' })
    @ApiQuery({ name: 'year', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Public holidays retrieved successfully', type: [HolidayResponseDto] })
    async findPublicHolidays(@Query('year') year?: number): Promise<HolidayResponseDto[]> {
        return this.holidayService.findPublicHolidays(year);
    }

    @Get('optional/list')
    @ApiOperation({ summary: 'Get all optional holidays' })
    @ApiQuery({ name: 'year', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Optional holidays retrieved successfully', type: [HolidayResponseDto] })
    async findOptionalHolidays(@Query('year') year?: number): Promise<HolidayResponseDto[]> {
        return this.holidayService.findOptionalHolidays(year);
    }

    @Get('location/:location')
    @ApiOperation({ summary: 'Get holidays by location' })
    @ApiParam({ name: 'location', description: 'Location name' })
    @ApiQuery({ name: 'year', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Holidays retrieved successfully', type: [HolidayResponseDto] })
    async findHolidaysByLocation(
        @Param('location') location: string,
        @Query('year') year?: number,
    ): Promise<HolidayResponseDto[]> {
        return this.holidayService.findHolidaysByLocation(location, year);
    }

    @Get('date-range/list')
    @ApiOperation({ summary: 'Get holidays within a date range' })
    @ApiQuery({ name: 'startDate', required: true, type: String, description: 'Start date (YYYY-MM-DD)' })
    @ApiQuery({ name: 'endDate', required: true, type: String, description: 'End date (YYYY-MM-DD)' })
    @ApiQuery({ name: 'location', required: false, type: String })
    @ApiResponse({ status: 200, description: 'Holidays retrieved successfully', type: [HolidayResponseDto] })
    async findHolidaysByDateRange(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('location') location?: string,
    ): Promise<HolidayResponseDto[]> {
        return this.holidayService.findHolidaysByDateRange(
            new Date(startDate),
            new Date(endDate),
            location,
        );
    }
}