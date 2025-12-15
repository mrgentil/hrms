import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    ParseIntPipe,
    Res,
    ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { PayslipsService } from './payslips.service';
import { CreatePayslipDto } from './dto/create-payslip.dto';
import { UpdatePayslipDto } from './dto/update-payslip.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('payroll/payslips')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PayslipsController {
    constructor(private readonly payslipsService: PayslipsService) { }

    /**
     * Get all payslips (HR/Admin only)
     */
    @Get()
    @RequirePermissions('payroll.view')
    async findAll(
        @Query('user_id') userId?: string,
        @Query('month') month?: string,
        @Query('year') year?: string,
        @Query('status') status?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const filters = {
            user_id: userId ? parseInt(userId) : undefined,
            month: month ? parseInt(month) : undefined,
            year: year ? parseInt(year) : undefined,
            status,
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        };

        return await this.payslipsService.findAll(filters);
    }

    /**
     * Get current user's payslips
     */
    @Get('my')
    async findMy(
        @CurrentUser() currentUser: any,
        @Query('year') year?: string,
    ) {
        const filters = {
            year: year ? parseInt(year) : undefined,
        };

        return await this.payslipsService.findMyPayslips(currentUser.id, filters);
    }

    /**
     * Create a new payslip (HR/Admin only)
     */
    @Post()
    @RequirePermissions('payroll.manage')
    async create(
        @CurrentUser() currentUser: any,
        @Body(ValidationPipe) dto: CreatePayslipDto,
    ) {
        return await this.payslipsService.create(currentUser.id, dto);
    }

    /**
     * Get a single payslip
     */
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return await this.payslipsService.findOne(id);
    }

    /**
     * Update a payslip (DRAFT only)
     */
    @Patch(':id')
    @RequirePermissions('payroll.manage')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body(ValidationPipe) dto: UpdatePayslipDto,
    ) {
        return await this.payslipsService.update(id, dto);
    }

    /**
     * Delete a payslip (DRAFT only)
     */
    @Delete(':id')
    @RequirePermissions('payroll.manage')
    async delete(@Param('id', ParseIntPipe) id: number) {
        return await this.payslipsService.delete(id);
    }

    /**
     * Publish a payslip
     */
    @Post(':id/publish')
    @RequirePermissions('payroll.manage')
    async publish(@Param('id', ParseIntPipe) id: number) {
        return await this.payslipsService.publish(id);
    }

    /**
     * Download payslip as PDF
     */
    @Get(':id/pdf')
    async downloadPDF(
        @Param('id', ParseIntPipe) id: number,
        @Res() res: Response,
    ) {
        const pdfBuffer = await this.payslipsService.generatePDF(id);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=bulletin_${id}.pdf`,
        });

        res.send(pdfBuffer);
    }

    /**
     * Simulate salary (Public/Auth)
     */
    @Post('simulate')
    async simulate(@Body('gross_salary') grossSalary: number) {
        return await this.payslipsService.simulateSalary(grossSalary);
    }
}
