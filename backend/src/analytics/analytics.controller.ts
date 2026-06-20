import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SYSTEM_PERMISSIONS } from '../roles/roles.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly exportService: ExportService,
  ) { }

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

  // ─── EXPORTS EXCEL ───────────────────────────────────────────────

  @Get('export/employees')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async exportEmployees(
    @Res() res: Response,
    @Query('department_id') departmentId?: string,
    @Query('active') active?: string,
  ) {
    const buffer = await this.exportService.exportEmployeesExcel({
      department_id: departmentId ? parseInt(departmentId) : undefined,
      active: active !== undefined ? active === 'true' : undefined,
    });

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="employes_${new Date().toISOString().split('T')[0]}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Get('export/payroll')
  @RequirePermissions('payroll.view')
  async exportPayroll(
    @Res() res: Response,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const m = parseInt(month);
    const y = parseInt(year);
    const buffer = await this.exportService.exportPayrollExcel(m, y);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="paie_${m}_${y}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Get('export/attendance')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async exportAttendance(
    @Res() res: Response,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const m = parseInt(month);
    const y = parseInt(year);
    const buffer = await this.exportService.exportAttendanceExcel(m, y);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="presences_${m}_${y}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Get('export/leaves')
  @RequirePermissions(SYSTEM_PERMISSIONS.LEAVES_VIEW_ALL)
  async exportLeaves(
    @Res() res: Response,
    @Query('year') year: string,
  ) {
    const y = parseInt(year) || new Date().getFullYear();
    const buffer = await this.exportService.exportLeavesExcel(y);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="conges_${y}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }
}
