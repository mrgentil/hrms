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
import { AdvancesService } from './advances.service';
import { CreateAdvanceDto } from './dto/create-advance.dto';
import { UpdateAdvanceDto } from './dto/update-advance.dto';
import { ReviewAdvanceDto } from './dto/review-advance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { advance_status } from '@prisma/client';

@Controller('payroll/advances')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdvancesController {
    constructor(private readonly advancesService: AdvancesService) { }

    /**
     * Get all advances (HR/Admin only)
     */
    @Get()
    @RequirePermissions('payroll.advances')
    async findAll(
        @Query('user_id') userId?: string,
        @Query('status') status?: advance_status,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const filters = {
            user_id: userId ? parseInt(userId) : undefined,
            status,
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        };

        return await this.advancesService.findAll(filters);
    }

    /**
     * Get current user's advances
     */
    @Get('my')
    async findMyAdvances(@CurrentUser() currentUser: any) {
        return await this.advancesService.findMyAdvances(currentUser.id);
    }

    /**
     * Create a new advance request
     */
    @Post()
    async create(
        @CurrentUser() currentUser: any,
        @Body(ValidationPipe) dto: CreateAdvanceDto,
    ) {
        const advance = await this.advancesService.create(currentUser.id, dto);
        return {
            success: true,
            data: advance,
            message: 'Advance créée avec succès',
        };
    }

    /**
     * Get a single advance
     */
    @Get(':id')
    async findOne(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() currentUser: any,
    ) {
        // Service will check permissions
        return await this.advancesService.findOne(id, currentUser.id);
    }

    /**
     * Update an advance (DRAFT only)
     */
    @Patch(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() currentUser: any,
        @Body(ValidationPipe) dto: UpdateAdvanceDto,
    ) {
        return await this.advancesService.update(id, currentUser.id, dto);
    }

    /**
     * Delete an advance (DRAFT/CANCELLED only)
     */
    @Delete(':id')
    async delete(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() currentUser: any,
    ) {
        return await this.advancesService.delete(id, currentUser.id);
    }

    /**
     * Submit an advance for approval
     */
    @Post(':id/submit')
    async submit(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() currentUser: any,
    ) {
        return await this.advancesService.submit(id, currentUser.id);
    }

    /**
     * Review an advance (approve/reject) - HR/Admin only
     */
    @Post(':id/review')
    @RequirePermissions('payroll.advances')
    async review(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() currentUser: any,
        @Body(ValidationPipe) dto: ReviewAdvanceDto,
    ) {
        return await this.advancesService.review(id, currentUser.id, dto);
    }

    /**
     * Cancel an advance
     */
    @Post(':id/cancel')
    async cancel(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() currentUser: any,
    ) {
        return await this.advancesService.cancel(id, currentUser.id);
    }
}
