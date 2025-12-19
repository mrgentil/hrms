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
    ValidationPipe,
} from '@nestjs/common';
import { FundRequestsService } from './fund-requests.service';
import { CreateFundRequestDto } from './dto/create-fund-request.dto';
import { UpdateFundRequestDto } from './dto/update-fund-request.dto';
import { ReviewFundRequestDto } from './dto/review-fund-request.dto';
import { MarkAsPaidDto } from './dto/mark-as-paid.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { fund_request_status } from '@prisma/client';

@Controller('payroll/fund-requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FundRequestsController {
    constructor(private readonly fundRequestsService: FundRequestsService) { }

    /**
     * Get all fund requests (HR/Admin/Finance only)
     */
    @Get()
    @RequirePermissions('payroll.fund_requests')
    async findAll(
        @Query('user_id') userId?: string,
        @Query('status') status?: fund_request_status,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const filters = {
            user_id: userId ? parseInt(userId) : undefined,
            status,
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        };

        return await this.fundRequestsService.findAll(filters);
    }

    /**
     * Get current user's fund requests
     */
    @Get('my')
    async findMyRequests(@CurrentUser() currentUser: any) {
        return await this.fundRequestsService.findMyRequests(currentUser.id);
    }

    /**
     * Create a new fund request
     */
    @Post()
    async create(
        @CurrentUser() currentUser: any,
        @Body(ValidationPipe) dto: CreateFundRequestDto,
    ) {
        const request = await this.fundRequestsService.create(currentUser.id, dto);
        return {
            success: true,
            data: request,
            message: 'Demande de fonds créée avec succès',
        };
    }

    /**
     * Get a single fund request
     */
    @Get(':id')
    async findOne(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() currentUser: any,
    ) {
        return await this.fundRequestsService.findOne(id, currentUser.id);
    }

    /**
     * Update a fund request (DRAFT only)
     */
    @Patch(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() currentUser: any,
        @Body(ValidationPipe) dto: UpdateFundRequestDto,
    ) {
        return await this.fundRequestsService.update(id, currentUser.id, dto);
    }

    /**
     * Delete a fund request (DRAFT/CANCELLED only)
     */
    @Delete(':id')
    async delete(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() currentUser: any,
    ) {
        return await this.fundRequestsService.delete(id, currentUser.id);
    }

    /**
     * Submit a fund request for approval
     */
    @Post(':id/submit')
    async submit(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() currentUser: any,
    ) {
        return await this.fundRequestsService.submit(id, currentUser.id);
    }

    /**
     * Review a fund request (approve/reject) - HR/Admin/Finance only
     */
    @Post(':id/review')
    @RequirePermissions('payroll.fund_requests')
    async review(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() currentUser: any,
        @Body(ValidationPipe) dto: ReviewFundRequestDto,
    ) {
        return await this.fundRequestsService.review(id, currentUser.id, dto);
    }

    /**
     * Mark a fund request as paid - Finance only
     */
    @Post(':id/pay')
    @RequirePermissions('payroll.fund_requests')
    async markAsPaid(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() currentUser: any,
        @Body(ValidationPipe) dto: MarkAsPaidDto,
    ) {
        return await this.fundRequestsService.markAsPaid(id, currentUser.id, dto);
    }

    /**
     * Cancel a fund request
     */
    @Post(':id/cancel')
    async cancel(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() currentUser: any,
    ) {
        return await this.fundRequestsService.cancel(id, currentUser.id);
    }
}
