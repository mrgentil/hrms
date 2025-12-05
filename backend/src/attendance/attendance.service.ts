import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckInDto, CheckOutDto } from './dto/check-in.dto';
import { attendance_status } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  // Check-in pour aujourd'hui
  async checkIn(userId: number, dto: CheckInDto) {
    const now = new Date();
    
    // Date du jour à minuit UTC (pour correspondre au format stocké en DB)
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));

    const workStartHour = 9; // 9h00
    const isLate = now.getHours() > workStartHour || 
                   (now.getHours() === workStartHour && now.getMinutes() > 15);

    const status = dto.status || (isLate ? attendance_status.LATE : attendance_status.PRESENT);

    // Utiliser upsert pour gérer la création ou mise à jour
    const attendance = await this.prisma.attendance.upsert({
      where: {
        user_id_date: {
          user_id: userId,
          date: today,
        },
      },
      update: {
        // Si l'enregistrement existe déjà et a un check_in, on ne fait rien (sera géré après)
        check_in: now,
        check_in_location: dto.location,
        status,
        notes: dto.notes,
      },
      create: {
        user_id: userId,
        date: today,
        check_in: now,
        check_in_location: dto.location,
        status,
        notes: dto.notes,
      },
      include: { user: { select: { id: true, full_name: true } } },
    });

    // Log de pointage arrivée
    await this.auditService.log({
      user_id: userId,
      action: 'CHECK_IN',
      entity_type: 'attendance',
      entity_id: attendance.id,
      new_values: { check_in: now.toISOString(), status },
    });

    return attendance;
  }

  // Check-out pour aujourd'hui
  async checkOut(userId: number, dto: CheckOutDto) {
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));

    const attendance = await this.prisma.attendance.findUnique({
      where: {
        user_id_date: {
          user_id: userId,
          date: today,
        },
      },
    });

    if (!attendance) {
      throw new BadRequestException('Vous devez d\'abord pointer votre arrivée');
    }

    if (!attendance.check_in) {
      throw new BadRequestException('Vous devez d\'abord pointer votre arrivée');
    }

    if (attendance.check_out) {
      throw new BadRequestException('Vous avez déjà pointé votre départ aujourd\'hui');
    }

    const checkInTime = new Date(attendance.check_in);
    
    // Calcul des heures travaillées
    const diffMs = now.getTime() - checkInTime.getTime();
    const workedHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    
    // Calcul des heures supplémentaires (> 8h)
    const overtimeHours = workedHours > 8 ? Math.round((workedHours - 8) * 100) / 100 : 0;

    const updated = await this.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        check_out: now,
        check_out_location: dto.location,
        worked_hours: workedHours,
        overtime_hours: overtimeHours,
        notes: dto.notes ? `${attendance.notes || ''}\n${dto.notes}`.trim() : attendance.notes,
      },
      include: { user: { select: { id: true, full_name: true } } },
    });

    // Log de pointage départ
    await this.auditService.log({
      user_id: userId,
      action: 'CHECK_OUT',
      entity_type: 'attendance',
      entity_id: updated.id,
      new_values: { check_out: now.toISOString(), worked_hours: workedHours },
    });

    return updated;
  }

  // Obtenir le pointage d'aujourd'hui
  async getTodayAttendance(userId: number) {
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));

    return this.prisma.attendance.findUnique({
      where: {
        user_id_date: {
          user_id: userId,
          date: today,
        },
      },
      include: { user: { select: { id: true, full_name: true } } },
    });
  }

  // Historique des pointages de l'utilisateur
  async getMyAttendance(userId: number, startDate?: string, endDate?: string) {
    const where: any = { user_id: userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    return this.prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 30,
    });
  }

  // Statistiques mensuelles de l'utilisateur
  async getMyMonthlyStats(userId: number, month?: number, year?: number) {
    const now = new Date();
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    const attendances = await this.prisma.attendance.findMany({
      where: {
        user_id: userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const stats = {
      totalDays: attendances.length,
      presentDays: attendances.filter(a => a.status === 'PRESENT').length,
      lateDays: attendances.filter(a => a.status === 'LATE').length,
      absentDays: attendances.filter(a => a.status === 'ABSENT').length,
      remoteDays: attendances.filter(a => a.status === 'REMOTE').length,
      onLeaveDays: attendances.filter(a => a.status === 'ON_LEAVE').length,
      totalWorkedHours: attendances.reduce((sum, a) => sum + (a.worked_hours || 0), 0),
      totalOvertimeHours: attendances.reduce((sum, a) => sum + (a.overtime_hours || 0), 0),
      month: targetMonth,
      year: targetYear,
    };

    return stats;
  }

  // Admin: Liste des pointages de tous les employés
  async getAllAttendance(startDate?: string, endDate?: string, userId?: number) {
    const where: any = {};

    if (userId) where.user_id = userId;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    } else {
      // Par défaut: aujourd'hui
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.date = today;
    }

    return this.prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            work_email: true,
            department_user_department_idTodepartment: {
              select: { department_name: true },
            },
            position: {
              select: { title: true },
            },
          },
        },
      },
      orderBy: [{ date: 'desc' }, { check_in: 'desc' }],
    });
  }

  // Admin: Statistiques globales
  async getGlobalStats(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const [totalEmployees, todayAttendances] = await Promise.all([
      this.prisma.user.count({ where: { active: true } }),
      this.prisma.attendance.findMany({
        where: { date: targetDate },
      }),
    ]);

    const checkedIn = todayAttendances.filter(a => a.check_in).length;
    const checkedOut = todayAttendances.filter(a => a.check_out).length;
    const late = todayAttendances.filter(a => a.status === 'LATE').length;
    const remote = todayAttendances.filter(a => a.status === 'REMOTE').length;
    const onLeave = todayAttendances.filter(a => a.status === 'ON_LEAVE').length;

    return {
      date: targetDate,
      totalEmployees,
      checkedIn,
      checkedOut,
      notCheckedIn: totalEmployees - checkedIn,
      late,
      remote,
      onLeave,
      attendanceRate: totalEmployees > 0 ? Math.round((checkedIn / totalEmployees) * 100) : 0,
    };
  }

  // Admin: Modifier un pointage
  async updateAttendance(attendanceId: number, data: Partial<{
    check_in: Date;
    check_out: Date;
    status: attendance_status;
    notes: string;
  }>) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id: attendanceId },
    });

    if (!attendance) {
      throw new NotFoundException('Pointage non trouvé');
    }

    // Recalculer les heures si check_in et check_out sont modifiés
    let worked_hours = attendance.worked_hours;
    let overtime_hours = attendance.overtime_hours;

    const checkIn = data.check_in || attendance.check_in;
    const checkOut = data.check_out || attendance.check_out;

    if (checkIn && checkOut) {
      const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime();
      worked_hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
      overtime_hours = worked_hours > 8 ? Math.round((worked_hours - 8) * 100) / 100 : 0;
    }

    return this.prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        ...data,
        worked_hours,
        overtime_hours,
      },
      include: { user: { select: { id: true, full_name: true } } },
    });
  }
}
