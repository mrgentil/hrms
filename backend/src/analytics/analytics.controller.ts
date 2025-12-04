import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SYSTEM_PERMISSIONS } from '../roles/roles.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async getDashboard() {
    const overview = await this.analyticsService.getDashboardOverview();
    return { success: true, data: overview };
  }

  @Get('employees/by-department')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async getEmployeesByDepartment() {
    const data = await this.analyticsService.getEmployeesByDepartment();
    return { success: true, data };
  }

  @Get('attendance/trend')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async getAttendanceTrend() {
    const data = await this.analyticsService.getAttendanceTrend();
    return { success: true, data };
  }

  @Get('leaves/by-type')
  @RequirePermissions(SYSTEM_PERMISSIONS.LEAVES_VIEW_ALL)
  async getLeavesByType() {
    const data = await this.analyticsService.getLeavesByType();
    return { success: true, data };
  }

  @Get('leaves/by-status')
  @RequirePermissions(SYSTEM_PERMISSIONS.LEAVES_VIEW_ALL)
  async getLeavesByStatus() {
    const data = await this.analyticsService.getLeavesByStatus();
    return { success: true, data };
  }

  @Get('expenses/by-category')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async getExpensesByCategory() {
    const data = await this.analyticsService.getExpensesByCategory();
    return { success: true, data };
  }

  @Get('expenses/trend')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async getExpensesTrend() {
    const data = await this.analyticsService.getExpensesTrend();
    return { success: true, data };
  }

  @Get('expenses/top-spenders')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async getTopSpenders() {
    const data = await this.analyticsService.getTopSpenders();
    return { success: true, data };
  }

  @Get('birthdays')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async getUpcomingBirthdays() {
    const data = await this.analyticsService.getUpcomingBirthdays();
    return { success: true, data };
  }

  @Get('contracts/expiring')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async getExpiringContracts() {
    const data = await this.analyticsService.getExpiringContracts();
    return { success: true, data };
  }

  @Get('activity')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async getRecentActivity() {
    const data = await this.analyticsService.getRecentActivity();
    return { success: true, data };
  }
}
