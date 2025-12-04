import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Query,
  Param,
  ParseIntPipe,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CheckInDto, CheckOutDto, GetAttendanceQueryDto } from './dto/check-in.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SYSTEM_PERMISSIONS } from '../roles/roles.service';

@Controller('attendance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ==========================================
  // ENDPOINTS EMPLOYÉ (self-service)
  // ==========================================

  @Post('check-in')
  async checkIn(
    @CurrentUser() user: any,
    @Body(ValidationPipe) dto: CheckInDto,
  ) {
    const attendance = await this.attendanceService.checkIn(user.id, dto);
    return {
      success: true,
      data: attendance,
      message: 'Arrivée pointée avec succès',
    };
  }

  @Post('check-out')
  async checkOut(
    @CurrentUser() user: any,
    @Body(ValidationPipe) dto: CheckOutDto,
  ) {
    const attendance = await this.attendanceService.checkOut(user.id, dto);
    return {
      success: true,
      data: attendance,
      message: 'Départ pointé avec succès',
    };
  }

  @Get('today')
  async getTodayAttendance(@CurrentUser() user: any) {
    const attendance = await this.attendanceService.getTodayAttendance(user.id);
    return {
      success: true,
      data: attendance,
    };
  }

  @Get('my')
  async getMyAttendance(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const attendances = await this.attendanceService.getMyAttendance(
      user.id,
      startDate,
      endDate,
    );
    return {
      success: true,
      data: attendances,
    };
  }

  @Get('my/stats')
  async getMyMonthlyStats(
    @CurrentUser() user: any,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const stats = await this.attendanceService.getMyMonthlyStats(
      user.id,
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined,
    );
    return {
      success: true,
      data: stats,
    };
  }

  // ==========================================
  // ENDPOINTS ADMIN / RH
  // ==========================================

  @Get()
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async getAllAttendance(@Query(ValidationPipe) query: GetAttendanceQueryDto) {
    const attendances = await this.attendanceService.getAllAttendance(
      query.startDate,
      query.endDate,
      query.userId ? parseInt(query.userId) : undefined,
    );
    return {
      success: true,
      data: attendances,
    };
  }

  @Get('stats/global')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async getGlobalStats(@Query('date') date?: string) {
    const stats = await this.attendanceService.getGlobalStats(date);
    return {
      success: true,
      data: stats,
    };
  }

  @Patch(':id')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_EDIT)
  async updateAttendance(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    const attendance = await this.attendanceService.updateAttendance(id, data);
    return {
      success: true,
      data: attendance,
      message: 'Pointage mis à jour avec succès',
    };
  }
}
