import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { BenefitsService } from './benefits.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('payroll/benefits')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BenefitsController {
    constructor(private readonly benefitsService: BenefitsService) { }

    @Get('catalog')
    async getCatalog() {
        return await this.benefitsService.getBenefits({});
    }

    @Get('my')
    async getMyBenefits(@CurrentUser() user: any) {
        return await this.benefitsService.getMyBenefits(user.id);
    }

    @Post('catalog')
    @RequirePermissions('payroll.manage')
    async createBenefit(@Body() dto: any) {
        return await this.benefitsService.createBenefit(dto);
    }

    @Post('enroll')
    async enroll(@CurrentUser() user: any, @Body() dto: any) {
        return await this.benefitsService.enrollBenefit(user.id, dto);
    }

    @Delete('enrollments/:id')
    @RequirePermissions('payroll.manage')
    async terminateEnrollment(@Param('id', ParseIntPipe) id: number) {
        return await this.benefitsService.terminateEnrollment(id);
    }
}
