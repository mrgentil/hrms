import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) { }

  private getCompanyFilter(user: any) {
    // Si l'utilisateur n'a pas de company_id (Super Admin?), pas de filtre
    // Mais la demande est spécifique pour restreindre l'admin.
    // On suppose que user.company_id est présent.
    if (!user.company_id) return {};
    return { company_id: user.company_id };
  }

  private getUserScopeFilter(user: any) {
    if (!user.company_id) return {};
    return { user: { company_id: user.company_id } };
  }

  // Dashboard principal - Vue d'ensemble
  async getDashboardOverview(user: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const companyFilter = this.getCompanyFilter(user);
    const userScopeFilter = this.getUserScopeFilter(user);

    const [
      totalEmployees,
      activeEmployees,
      newHiresThisMonth,
      departmentsCount,
      todayAttendance,
      pendingLeaves,
      pendingExpenses,
      totalExpensesMonth,
    ] = await Promise.all([
      // Total employés
      this.prisma.user.count({ where: { ...companyFilter } }),
      // Employés actifs
      this.prisma.user.count({ where: { ...companyFilter, active: true } }),
      // Nouvelles embauches ce mois
      this.prisma.user.count({
        where: { ...companyFilter, hire_date: { gte: startOfMonth, lte: endOfMonth } },
      }),
      // Nombre de départements
      this.prisma.department.count({ where: { ...companyFilter } }),
      // Présences aujourd'hui (plage de dates)
      this.prisma.attendance.count({
        where: {
          user: { ...companyFilter }, // Attendance -> User -> Company
          date: { gte: today, lte: endOfToday },
          check_in: { not: null },
        },
      }),
      // Congés en attente
      this.prisma.application.count({
        where: { ...userScopeFilter, status: 'Pending' },
      }),
      // Notes de frais en attente
      this.prisma.expense_report.count({
        where: { ...userScopeFilter, status: 'PENDING' },
      }),
      // Total dépenses du mois
      this.prisma.expense_report.aggregate({
        where: {
          ...userScopeFilter,
          status: { in: ['APPROVED', 'PAID'] },
          expense_date: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        inactive: totalEmployees - activeEmployees,
        newThisMonth: newHiresThisMonth,
      },
      departments: departmentsCount,
      attendance: {
        presentToday: todayAttendance,
        absentToday: activeEmployees - todayAttendance,
        attendanceRate: activeEmployees > 0
          ? Math.round((todayAttendance / activeEmployees) * 100)
          : 0,
      },
      pending: {
        leaves: pendingLeaves,
        expenses: pendingExpenses,
      },
      expenses: {
        totalMonth: totalExpensesMonth._sum.amount || 0,
      },
    };
  }

  // Statistiques des employés par département
  async getEmployeesByDepartment(user: any) {
    const companyFilter = this.getCompanyFilter(user);
    const departments = await this.prisma.department.findMany({
      where: { ...companyFilter },
      include: {
        users: true,
      },
    });

    return departments.map(d => ({
      name: d.name,
      count: d.users?.length || 0,
    }));
  }

  // Tendance des présences (7 derniers jours)
  async getAttendanceTrend(user: any) {
    const days: { start: Date; end: Date; display: Date }[] = [];
    const today = new Date();
    const userScopeFilter = this.getUserScopeFilter(user);

    for (let i = 6; i >= 0; i--) {
      const start = new Date(today);
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      days.push({ start, end, display: start });
    }

    const attendanceData = await Promise.all(
      days.map(async ({ start, end, display }) => {
        const count = await this.prisma.attendance.count({
          where: {
            ...userScopeFilter, // Filter via user relation
            date: {
              gte: start,
              lte: end,
            },
            check_in: { not: null },
          },
        });
        return {
          date: display.toISOString().split('T')[0],
          day: display.toLocaleDateString('fr-FR', { weekday: 'short' }),
          count,
        };
      })
    );

    return attendanceData;
  }

  // Statistiques des congés par type
  async getLeavesByType(user: any) {
    const userScopeFilter = this.getUserScopeFilter(user);
    // leave_type is global usually, but applications are company-specific
    const leaveTypes = await this.prisma.leave_type.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            application: { where: { ...userScopeFilter } }
          },
        },
      },
    });

    return leaveTypes.map(lt => ({
      id: lt.id,
      name: lt.name,
      count: lt._count.application,
    }));
  }

  // Statistiques des congés par statut
  async getLeavesByStatus(user: any) {
    const userScopeFilter = this.getUserScopeFilter(user);
    const statuses = await this.prisma.application.groupBy({
      by: ['status'],
      where: { ...userScopeFilter },
      _count: true,
    });

    return statuses.map(s => ({
      status: s.status,
      count: s._count,
    }));
  }

  // Dépenses par catégorie (mois en cours)
  async getExpensesByCategory(user: any) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const userScopeFilter = this.getUserScopeFilter(user);

    const expenses = await this.prisma.expense_report.groupBy({
      by: ['category'],
      where: {
        ...userScopeFilter,
        expense_date: { gte: startOfMonth },
      },
      _sum: { amount: true },
      _count: true,
    });

    return expenses.map(e => ({
      category: e.category,
      total: e._sum.amount || 0,
      count: e._count,
    }));
  }

  // Évolution des dépenses (6 derniers mois)
  async getExpensesTrend(user: any) {
    const months: Array<{ start: Date; end: Date; label: string }> = [];
    const today = new Date();
    const userScopeFilter = this.getUserScopeFilter(user);

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        start: date,
        end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
        label: date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      });
    }

    const expenseData = await Promise.all(
      months.map(async ({ start, end, label }) => {
        const result = await this.prisma.expense_report.aggregate({
          where: {
            ...userScopeFilter,
            expense_date: { gte: start, lte: end },
            status: { in: ['APPROVED', 'PAID'] },
          },
          _sum: { amount: true },
        });
        return {
          month: label,
          amount: result._sum.amount || 0,
        };
      })
    );

    return expenseData;
  }

  // Top 5 employés avec le plus de dépenses ce mois
  async getTopSpenders(user: any) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const userScopeFilter = this.getUserScopeFilter(user);
    const companyFilter = this.getCompanyFilter(user);

    const topSpenders = await this.prisma.expense_report.groupBy({
      by: ['user_id'],
      where: {
        ...userScopeFilter,
        expense_date: { gte: startOfMonth },
        status: { in: ['APPROVED', 'PAID'] },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 5,
    });

    const userIds = topSpenders.map(s => s.user_id);
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
        ...companyFilter // Redundant check but safe
      },
      select: { id: true, full_name: true },
    });

    return topSpenders.map(s => ({
      user: users.find(u => u.id === s.user_id),
      total: s._sum.amount || 0,
    }));
  }

  // Anniversaires du mois
  async getUpcomingBirthdays(user: any) {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const userScopeFilter = this.getUserScopeFilter(user);

    const birthdays = await this.prisma.user_personal_info.findMany({
      where: {
        AND: [
          { date_of_birth: { not: null } },
          { ...userScopeFilter } // PersonalInfo -> User -> Company
        ],
      },
      select: {
        date_of_birth: true,
        user: { select: { id: true, full_name: true, profile_photo_url: true } },
      },
    });

    // Filtrer ceux du mois en cours
    return birthdays
      .filter(b => {
        if (!b.date_of_birth) return false;
        const birthMonth = new Date(b.date_of_birth).getMonth() + 1;
        return birthMonth === currentMonth;
      })
      .map(b => ({
        user: b.user,
        date: b.date_of_birth,
      }))
      .slice(0, 5);
  }

  // Contrats arrivant à échéance (30 jours)
  async getExpiringContracts(user: any) {
    const today = new Date();
    const in30Days = new Date(today);
    in30Days.setDate(in30Days.getDate() + 30);
    const userScopeFilter = this.getUserScopeFilter(user);

    const contracts = await this.prisma.employment_contract.findMany({
      where: {
        end_date: { gte: today, lte: in30Days },
        status: 'ACTIVE',
        ...userScopeFilter // Contract -> User -> Company
      },
      include: {
        user: { select: { id: true, full_name: true } },
      },
      orderBy: { end_date: 'asc' },
      take: 5,
    });

    return contracts.map(c => ({
      user: c.user,
      endDate: c.end_date,
      type: c.contract_type,
    }));
  }

  // Activité récente
  async getRecentActivity(user: any) {
    const userScopeFilter = this.getUserScopeFilter(user);
    const companyFilter = this.getCompanyFilter(user);

    const [recentLeaves, recentExpenses, recentHires] = await Promise.all([
      // Dernières demandes de congés
      this.prisma.application.findMany({
        where: { ...userScopeFilter },
        take: 3,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { full_name: true } },
          leave_type: { select: { name: true } },
        },
      }),
      // Dernières notes de frais
      this.prisma.expense_report.findMany({
        where: { ...userScopeFilter },
        take: 3,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { full_name: true } },
        },
      }),
      // Dernières embauches
      this.prisma.user.findMany({
        where: { ...companyFilter },
        take: 3,
        orderBy: { created_at: 'desc' },
        select: { full_name: true, created_at: true, hire_date: true },
      }),
    ]);

    const activities = [
      ...recentLeaves.map(l => ({
        type: 'leave',
        message: `${l.user?.full_name} a demandé un congé ${l.leave_type?.name || ''}`,
        date: l.created_at,
        status: l.status,
      })),
      ...recentExpenses.map(e => ({
        type: 'expense',
        message: `${e.user?.full_name} - Note de frais: ${e.title}`,
        date: e.created_at,
        status: e.status,
      })),
      ...recentHires.map(u => ({
        type: 'hire',
        message: `${u.full_name} a rejoint l'équipe`,
        date: u.hire_date || u.created_at,
        status: 'NEW',
      })),
    ];

    // Trier par date et prendre les 10 plus récentes
    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }
}
