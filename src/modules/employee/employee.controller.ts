import { Controller, Post, Put, Delete, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeFilterDto } from './dto/employee-filter.dto';
import { EmployeeSearchDto } from './dto/employee-search.dto';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Employee Management')
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.HR_ADMIN, Role.REPORTING_MANAGER)
export class EmployeeController {
    constructor(private readonly employeeService: EmployeeService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new employee' })
    @ApiResponse({ status: 201, description: 'Employee created successfully', type: EmployeeResponseDto })
    async createEmployee(@Body() createEmployeeDto: CreateEmployeeDto): Promise<EmployeeResponseDto> {
        return this.employeeService.createEmployee(createEmployeeDto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update an existing employee' })
    @ApiResponse({ status: 200, description: 'Employee updated successfully', type: EmployeeResponseDto })
    async updateEmployee(
        @Param('id') id: string,
        @Body() updateEmployeeDto: UpdateEmployeeDto,
    ): Promise<EmployeeResponseDto> {
        return this.employeeService.updateEmployee(id, updateEmployeeDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an employee (soft delete)' })
    @ApiResponse({ status: 204, description: 'Employee deleted successfully' })
    async deleteEmployee(@Param('id') id: string): Promise<void> {
        return this.employeeService.deleteEmployee(id);
    }

    @Get()
    @ApiOperation({ summary: 'Get all employees with optional filters' })
    @ApiResponse({ status: 200, description: 'Employees retrieved successfully', type: [EmployeeResponseDto] })
    async findAll(@Query() filterDto?: EmployeeFilterDto): Promise<EmployeeResponseDto[]> {
        return this.employeeService.findAll(filterDto);
    }

    @Get('search')
    @ApiOperation({ summary: 'Search employees' })
    @ApiResponse({ status: 200, description: 'Employees retrieved successfully', type: [EmployeeResponseDto] })
    async searchEmployees(@Query() searchDto: EmployeeSearchDto): Promise<EmployeeResponseDto[]> {
        return this.employeeService.searchEmployees(searchDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get employee by ID' })
    @ApiResponse({ status: 200, description: 'Employee retrieved successfully', type: EmployeeResponseDto })
    async findOne(@Param('id') id: string): Promise<EmployeeResponseDto> {
        return this.employeeService.findOne(id);
    }
}