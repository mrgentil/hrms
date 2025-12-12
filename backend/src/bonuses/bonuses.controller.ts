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

@Controller('payroll/bonuses')
@UseGuards(JwtAuthGuard)
export class BonusesController {
    constructor(private readonly bonusesService: BonusesService) { }

    @Get()
    async findAll() {
        return await this.bonusesService.getBonuses({});
    }

    @Get('my')
    async findMy() {
        return await this.bonusesService.getMyBonuses();
    }

    @Post()
    async create(@Body() dto: any) {
        return await this.bonusesService.createBonus(dto);
    }

    @Post(':id/submit')
    async submit(@Param('id', ParseIntPipe) id: number) {
        return await this.bonusesService.submitBonus(id);
    }

    @Post(':id/review')
    async review(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: any,
    ) {
        return await this.bonusesService.reviewBonus(id, dto);
    }
}
