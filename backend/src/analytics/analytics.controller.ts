import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SYSTEM_PERMISSIONS } from '../roles/roles.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @Get('dashboard')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async getDashboard(@CurrentUser() user: any) {
    const overview = await this.analyticsService.getDashboardOverview(user);
    return { success: true, data: overview };
  }

  @Get('employees/by-department')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async getEmployeesByDepartment(@CurrentUser() user: any) {
    const data = await this.analyticsService.getEmployeesByDepartment(user);
    return { success: true, data };
  }

  @Get('attendance/trend')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async getAttendanceTrend(@CurrentUser() user: any) {
    const data = await this.analyticsService.getAttendanceTrend(user);
    return { success: true, data };
  }

  @Get('leaves/by-type')
  @RequirePermissions(SYSTEM_PERMISSIONS.LEAVES_VIEW_ALL)
  async getLeavesByType(@CurrentUser() user: any) {
    const data = await this.analyticsService.getLeavesByType(user);
    return { success: true, data };
  }

  @Get('leaves/by-status')
  @RequirePermissions(SYSTEM_PERMISSIONS.LEAVES_VIEW_ALL)
  async getLeavesByStatus(@CurrentUser() user: any) {
    const data = await this.analyticsService.getLeavesByStatus(user);
    return { success: true, data };
  }

  @Get('expenses/by-category')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async getExpensesByCategory(@CurrentUser() user: any) {
    const data = await this.analyticsService.getExpensesByCategory(user);
    return { success: true, data };
  }

  @Get('expenses/trend')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async getExpensesTrend(@CurrentUser() user: any) {
    const data = await this.analyticsService.getExpensesTrend(user);
    return { success: true, data };
  }

  @Get('expenses/top-spenders')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async getTopSpenders(@CurrentUser() user: any) {
    const data = await this.analyticsService.getTopSpenders(user);
    return { success: true, data };
  }

  @Get('birthdays')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async getUpcomingBirthdays(@CurrentUser() user: any) {
    const data = await this.analyticsService.getUpcomingBirthdays(user);
    return { success: true, data };
  }

  @Get('contracts/expiring')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async getExpiringContracts(@CurrentUser() user: any) {
    const data = await this.analyticsService.getExpiringContracts(user);
    return { success: true, data };
  }

  @Get('activity')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async getRecentActivity(@CurrentUser() user: any) {
    const data = await this.analyticsService.getRecentActivity(user);
    return { success: true, data };
  }
}
