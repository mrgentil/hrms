import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto, UpdateExpenseStatusDto, MarkAsPaidDto } from './dto/create-expense.dto';
import { expense_report_status } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) { }

  // Créer une note de frais
  async create(userId: number, dto: CreateExpenseDto) {
    return this.prisma.expense_report.create({
      data: {
        user_id: userId,
        title: dto.title,
        description: dto.description,
        amount: dto.amount,
        currency: dto.currency || 'USD',
        category: dto.category,
        expense_date: new Date(dto.expense_date),
        receipt_url: dto.receipt_url,
        status: 'DRAFT',
      },
      include: {
        user: { select: { id: true, full_name: true } },
      },
    });
  }

  // Obtenir mes notes de frais
  async findMy(userId: number, status?: expense_report_status) {
    return this.prisma.expense_report.findMany({
      where: {
        user_id: userId,
        ...(status && { status }),
      },
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { id: true, full_name: true } },
        approver: { select: { id: true, full_name: true } },
      },
    });
  }

  // Obtenir une note de frais par ID
  async findOne(id: number, userId?: number) {
    const expense = await this.prisma.expense_report.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, full_name: true, work_email: true } },
        approver: { select: { id: true, full_name: true } },
      },
    });

    if (!expense) {
      throw new NotFoundException('Note de frais non trouvée');
    }

    // Si userId fourni, vérifier que c'est bien sa note
    if (userId && expense.user_id !== userId) {
      throw new ForbiddenException('Accès non autorisé');
    }

    return expense;
  }

  // Mettre à jour ma note de frais (seulement si DRAFT)
  async update(id: number, userId: number, dto: UpdateExpenseDto) {
    const expense = await this.findOne(id, userId);

    if (expense.status !== 'DRAFT') {
      throw new BadRequestException('Seules les notes en brouillon peuvent être modifiées');
    }

    return this.prisma.expense_report.update({
      where: { id },
      data: {
        ...dto,
        expense_date: dto.expense_date ? new Date(dto.expense_date) : undefined,
      },
      include: {
        user: { select: { id: true, full_name: true } },
      },
    });
  }

  // Soumettre pour approbation
  async submit(id: number, userId: number) {
    const expense = await this.findOne(id, userId);

    if (expense.status !== 'DRAFT') {
      throw new BadRequestException('Seules les notes en brouillon peuvent être soumises');
    }

    if (!expense.receipt_url) {
      throw new BadRequestException('Un justificatif est requis pour soumettre la note');
    }

    return this.prisma.expense_report.update({
      where: { id },
      data: {
        status: 'PENDING',
        submitted_at: new Date(),
      },
      include: {
        user: { select: { id: true, full_name: true } },
      },
    });
  }

  // Annuler ma note de frais
  async cancel(id: number, userId: number) {
    const expense = await this.findOne(id, userId);

    if (!['DRAFT', 'PENDING'].includes(expense.status)) {
      throw new BadRequestException('Cette note ne peut plus être annulée');
    }

    return this.prisma.expense_report.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  // Supprimer (seulement brouillon)
  async remove(id: number, userId: number) {
    const expense = await this.findOne(id, userId);

    if (expense.status !== 'DRAFT') {
      throw new BadRequestException('Seules les notes en brouillon peuvent être supprimées');
    }

    await this.prisma.expense_report.delete({ where: { id } });
    return { message: 'Note de frais supprimée' };
  }

  // === ADMIN / MANAGER ===

  // Obtenir les notes à approuver
  async findPending() {
    return this.prisma.expense_report.findMany({
      where: { status: 'PENDING' },
      orderBy: { submitted_at: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            work_email: true,
            department_user_department_idTodepartment: { select: { department_name: true } },
          },
        },
      },
    });
  }

  // Obtenir toutes les notes (admin)
  async findAll(filters?: {
    status?: expense_report_status;
    userId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.userId) where.user_id = filters.userId;
    if (filters?.startDate || filters?.endDate) {
      where.expense_date = {};
      if (filters.startDate) where.expense_date.gte = new Date(filters.startDate);
      if (filters.endDate) where.expense_date.lte = new Date(filters.endDate);
    }

    return this.prisma.expense_report.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            department_user_department_idTodepartment: { select: { department_name: true } },
          },
        },
        approver: { select: { id: true, full_name: true } },
      },
    });
  }

  // Approuver ou rejeter
  async updateStatus(id: number, approverId: number, dto: UpdateExpenseStatusDto) {
    const expense = await this.prisma.expense_report.findUnique({ where: { id } });

    if (!expense) {
      throw new NotFoundException('Note de frais non trouvée');
    }

    if (expense.status !== 'PENDING') {
      throw new BadRequestException('Seules les notes en attente peuvent être traitées');
    }

    if (dto.status === 'REJECTED' && !dto.rejected_reason) {
      throw new BadRequestException('Un motif de rejet est requis');
    }

    return this.prisma.expense_report.update({
      where: { id },
      data: {
        status: dto.status,
        approved_by: approverId,
        approved_at: new Date(),
        rejected_reason: dto.rejected_reason,
      },
      include: {
        user: { select: { id: true, full_name: true } },
        approver: { select: { id: true, full_name: true } },
      },
    });
  }

  // Marquer comme payé
  async markAsPaid(id: number, dto: MarkAsPaidDto) {
    const expense = await this.prisma.expense_report.findUnique({ where: { id } });

    if (!expense) {
      throw new NotFoundException('Note de frais non trouvée');
    }

    if (expense.status !== 'APPROVED') {
      throw new BadRequestException('Seules les notes approuvées peuvent être marquées comme payées');
    }

    return this.prisma.expense_report.update({
      where: { id },
      data: {
        status: 'PAID',
        payment_date: dto.payment_date ? new Date(dto.payment_date) : new Date(),
        payment_ref: dto.payment_ref,
      },
    });
  }

  // Statistiques
  async getStats(userId?: number) {
    const where = userId ? { user_id: userId } : {};

    const [totals, byCategory, byStatus] = await Promise.all([
      this.prisma.expense_report.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.expense_report.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.expense_report.groupBy({
        by: ['status'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      total: totals._sum.amount || 0,
      count: totals._count,
      byCategory,
      byStatus,
    };
  }

  // Stats du mois en cours
  async getMonthlyStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [pending, approved, paid, totalAmount] = await Promise.all([
      this.prisma.expense_report.count({ where: { status: 'PENDING' } }),
      this.prisma.expense_report.count({
        where: { status: 'APPROVED', approved_at: { gte: startOfMonth, lte: endOfMonth } },
      }),
      this.prisma.expense_report.aggregate({
        where: { status: 'PAID', payment_date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
      this.prisma.expense_report.aggregate({
        where: { expense_date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
    ]);

    return {
      pending,
      approved,
      paidAmount: paid._sum.amount || 0,
      totalMonthAmount: totalAmount._sum.amount || 0,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
  }
}
