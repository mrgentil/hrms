import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PlanningService } from './planning.service';

@Controller('planning')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Get('team')
  async getTeamSchedule(
    @CurrentUser() user: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!startDate || !endDate) {
      const date = new Date();
      startDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
      endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();
    }
    return this.planningService.getTeamSchedule(user.id, startDate, endDate);
  }
}
