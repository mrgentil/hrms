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

@Controller('payroll/benefits')
@UseGuards(JwtAuthGuard)
export class BenefitsController {
    constructor(private readonly benefitsService: BenefitsService) { }

    @Get('catalog')
    async getCatalog() {
        return await this.benefitsService.getBenefits({});
    }

    @Get('my')
    async getMyBenefits() {
        return await this.benefitsService.getMyBenefits();
    }

    @Post('catalog')
    async createBenefit(@Body() dto: any) {
        return await this.benefitsService.createBenefit(dto);
    }

    @Post('enroll')
    async enroll(@Body() dto: any) {
        return await this.benefitsService.enrollBenefit(dto);
    }

    @Delete('enrollments/:id')
    async terminateEnrollment(@Param('id', ParseIntPipe) id: number) {
        return await this.benefitsService.terminateEnrollment(id);
    }
}
