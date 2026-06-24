import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { BonusesService } from './bonuses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('payroll/bonuses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BonusesController {
    constructor(private readonly bonusesService: BonusesService) { }

    @Get()
    @RequirePermissions('payroll.view')
    async findAll(@CurrentUser() user: any) {
        return await this.bonusesService.getBonuses({}, user);
    }

    @Get('my')
    async findMy(@CurrentUser() user: any) {
        return await this.bonusesService.getMyBonuses(user.id);
    }

    @Post()
    @RequirePermissions('payroll.manage')
    async create(@CurrentUser() user: any, @Body() dto: any) {
        return await this.bonusesService.createBonus(dto, user.id);
    }

    @Post(':id/submit')
    @RequirePermissions('payroll.manage')
    async submit(@Param('id', ParseIntPipe) id: number) {
        return await this.bonusesService.submitBonus(id);
    }

    @Post(':id/review')
    @RequirePermissions('payroll.manage')
    async review(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: any,
        @Body() dto: any,
    ) {
        return await this.bonusesService.reviewBonus(id, dto, user.id);
    }
}
