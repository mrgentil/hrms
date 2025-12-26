import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto, UpdateExpenseStatusDto, MarkAsPaidDto } from './dto/create-expense.dto';
import { expense_report_status } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import { SYSTEM_PERMISSIONS } from '../roles/roles.service';
import { NotificationType } from '../notifications/dto/create-notification.dto';

@Injectable()
export class ExpensesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private mailService: MailService,
  ) { }

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

    const updatedExpense = await this.prisma.expense_report.update({
      where: { id },
      data: {
        status: 'PENDING',
        submitted_at: new Date(),
      },
      include: {
        user: { select: { id: true, full_name: true } },
      },
    });

    // --- NOTIFICATIONS & EMAILS ---
    try {
      // 1. Trouver les utilisateurs qui ont la permission d'approuver les dépenses
      const potentialApprovers = await this.prisma.user.findMany({
        where: {
          active: true,
          role_relation: {
            role_permission: {
              some: {
                permission: {
                  name: SYSTEM_PERMISSIONS.EXPENSES_APPROVE,
                },
              },
            },
          },
        },
        include: {
          role_relation: true,
        },
      });

      // 2. Filtrer les Managers et Directeurs (selon demande utilisateur)
      const targetUsers = potentialApprovers.filter((u) => {
        const roleName = u.role_relation?.name?.toLowerCase() || '';
        const isManager = roleName.includes('manager');
        const isGlobalDirector = roleName.includes('directeur') || roleName.includes('director');
        const isFinance = roleName.includes('finance');

        // On exclut les Managers et les Directeurs (SAUF le Directeur Finance qui doit recevoir)
        if (isManager) return false;
        if (isGlobalDirector && !isFinance) return false;

        return true;
      });

      // 3. Envoyer notifs et emails
      for (const approver of targetUsers) {
        // Notification In-App
        await this.notificationsService.create({
          user_id: approver.id,
          type: NotificationType.SYSTEM,
          title: 'Nouvelle note de frais',
          message: `${updatedExpense.user.full_name} a soumis une note de frais de ${updatedExpense.amount} ${updatedExpense.currency}`,
          link: '/expenses?tab=approvals',
          entity_type: 'expense_report',
          entity_id: updatedExpense.id,
        });

        // Email
        if (approver.work_email) {
          await this.mailService.sendMail({
            to: approver.work_email,
            subject: `Action requise : Note de frais - ${updatedExpense.user.full_name}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #4f46e5;">Nouvelle note de frais à valider</h2>
                <p>Bonjour ${approver.full_name},</p>
                <p><strong>${updatedExpense.user.full_name}</strong> vient de soumettre une note de frais qui nécessite votre validation.</p>
                
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 15px 0;">
                  <ul style="list-style: none; padding: 0; margin: 0;">
                    <li style="margin-bottom: 5px;">💰 <strong>Montant :</strong> ${updatedExpense.amount} ${updatedExpense.currency}</li>
                    <li style="margin-bottom: 5px;">📅 <strong>Date :</strong> ${updatedExpense.expense_date.toLocaleDateString()}</li>
                    <li style="margin-bottom: 5px;">📂 <strong>Catégorie :</strong> ${updatedExpense.category}</li>
                    <li>📝 <strong>Description :</strong> ${updatedExpense.description || 'Aucune description'}</li>
                  </ul>
                </div>

                <p>Merci de vous connecter à l'application HRMS pour traiter cette demande.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/expenses?tab=approvals" 
                   style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                   Valider la note de frais
                </a>
              </div>
            `,
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications de note de frais:', error);
      // On ne bloque pas le retour de la fonction, la note est bien soumise
    }

    return updatedExpense;
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
            department: { select: { department_name: true } },
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
            department: { select: { department_name: true } },
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

    const updatedExpense = await this.prisma.expense_report.update({
      where: { id },
      data: {
        status: dto.status,
        approved_by: approverId,
        approved_at: new Date(),
        rejected_reason: dto.rejected_reason,
      },
      include: {
        user: { select: { id: true, full_name: true, work_email: true } },
        approver: { select: { id: true, full_name: true } },
      },
    });

    // --- NOTIFICATIONS & EMAILS ---
    try {
      const isApproved = dto.status === 'APPROVED';
      const isRejected = dto.status === 'REJECTED';
      const employee = updatedExpense.user;

      if (isApproved || isRejected) {
        // Notification Content
        const title = isApproved ? 'Note de frais approuvée' : 'Note de frais rejetée';
        const message = isApproved
          ? `Votre note de frais de ${updatedExpense.amount} ${updatedExpense.currency} a été approuvée.`
          : `Votre note de frais de ${updatedExpense.amount} ${updatedExpense.currency} a été rejetée.`;
        const actionText = isApproved ? 'Voir la note' : 'Voir les détails';

        // 1. In-App Notification
        await this.notificationsService.create({
          user_id: employee.id,
          type: NotificationType.SYSTEM, // Use SYSTEM to avoid 'Leave' specific icons/text
          title: title,
          message: message,
          link: '/expenses',
          entity_type: 'expense_report',
          entity_id: updatedExpense.id,
        });

        // 2. Email
        if (employee.work_email) {
          await this.mailService.sendMail({
            to: employee.work_email,
            subject: `${title} - ${updatedExpense.amount} ${updatedExpense.currency}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: ${isApproved ? '#059669' : '#dc2626'};">${title}</h2>
                <p>Bonjour ${employee.full_name},</p>
                <p>${message}</p>
                
                ${isRejected && updatedExpense.rejected_reason ? `
                <div style="background-color: #fee2e2; padding: 15px; border-radius: 6px; margin: 15px 0;">
                  <strong>Motif du rejet :</strong>
                  <p style="margin: 5px 0 0 0;">${updatedExpense.rejected_reason}</p>
                </div>
                ` : ''}

                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/expenses/${updatedExpense.id}" 
                   style="display: inline-block; background-color: ${isApproved ? '#059669' : '#dc2626'}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px;">
                   ${actionText}
                </a>
              </div>
            `,
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications de statut note de frais:', error);
    }

    return updatedExpense;
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
