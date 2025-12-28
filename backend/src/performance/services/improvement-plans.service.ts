import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/dto/create-notification.dto';
import {
  CreateImprovementPlanDto,
  UpdateImprovementPlanDto,
  AddActionDto,
  UpdateActionDto,
  ImprovementPlanQueryDto,
} from '../dto/improvement-plan.dto';

@Injectable()
export class ImprovementPlansService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateImprovementPlanDto, managerId: number) {
    // Vérifier que l'employé existe
    const employee = await this.prisma.user.findUnique({
      where: { id: dto.employee_id },
      select: { id: true, full_name: true, active: true, manager_user_id: true },
    });

    if (!employee || !employee.active) {
      throw new NotFoundException(`Employé #${dto.employee_id} non trouvé ou inactif`);
    }

    // Vérifier que le créateur est bien le manager de l'employé
    if (employee.manager_user_id !== managerId) {
      throw new ForbiddenException(
        'Vous ne pouvez créer un plan d\'amélioration que pour vos subordonnés directs',
      );
    }

    // Si lié à une review, vérifier la cohérence
    if (dto.review_id) {
      const review = await this.prisma.performance_review.findUnique({
        where: { id: dto.review_id },
      });

      if (!review) {
        throw new NotFoundException(`Review #${dto.review_id} non trouvée`);
      }

      if (review.employee_id !== dto.employee_id) {
        throw new BadRequestException(
          'La review doit appartenir au même employé',
        );
      }

      // Vérifier qu'il n'y a pas déjà un plan pour cette review
      const existingPlan = await this.prisma.perf_improvement_plan.findUnique({
        where: { review_id: dto.review_id },
      });

      if (existingPlan) {
        throw new BadRequestException(
          'Un plan d\'amélioration existe déjà pour cette review',
        );
      }
    }

    const plan = await this.prisma.perf_improvement_plan.create({
      data: {
        review_id: dto.review_id,
        employee_id: dto.employee_id,
        manager_id: managerId,
        title: dto.title,
        reason: dto.reason,
        start_date: new Date(dto.start_date),
        end_date: new Date(dto.end_date),
        status: 'DRAFT',
        actions: dto.actions?.length
          ? {
              create: dto.actions.map((action) => ({
                title: action.title,
                description: action.description,
                due_date: action.due_date ? new Date(action.due_date) : null,
                status: 'PENDING',
              })),
            }
          : undefined,
      },
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            position: { select: { title: true } },
          },
        },
        manager: {
          select: {
            id: true,
            full_name: true,
          },
        },
        actions: true,
      },
    });

    // Notification à l'employé
    await this.notificationsService.create({
      user_id: dto.employee_id,
      type: NotificationType.SYSTEM,
      title: 'Nouveau plan d\'amélioration',
      message: `Un plan d'amélioration "${dto.title}" a été créé pour vous`,
      link: `/performance/improvement-plans/${plan.id}`,
      entity_type: 'perf_improvement_plan',
      entity_id: plan.id,
    });

    return plan;
  }

  async findAll(query: ImprovementPlanQueryDto) {
    const { employee_id, manager_id, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (employee_id) where.employee_id = employee_id;
    if (manager_id) where.manager_id = manager_id;
    if (status) where.status = status;

    const [plans, total] = await Promise.all([
      this.prisma.perf_improvement_plan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          employee: {
            select: {
              id: true,
              full_name: true,
              position: { select: { title: true } },
              department: { select: { department_name: true } },
            },
          },
          manager: {
            select: {
              id: true,
              full_name: true,
            },
          },
          review: {
            select: {
              id: true,
              campaign: { select: { id: true, title: true, year: true } },
            },
          },
          _count: {
            select: { actions: true },
          },
        },
      }),
      this.prisma.perf_improvement_plan.count({ where }),
    ]);

    return {
      data: plans,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findMy(userId: number) {
    return this.prisma.perf_improvement_plan.findMany({
      where: { employee_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        manager: {
          select: {
            id: true,
            full_name: true,
          },
        },
        review: {
          select: {
            id: true,
            campaign: { select: { id: true, title: true, year: true } },
          },
        },
        actions: {
          orderBy: { due_date: 'asc' },
        },
      },
    });
  }

  async findTeam(managerId: number) {
    return this.prisma.perf_improvement_plan.findMany({
      where: { manager_id: managerId },
      orderBy: { created_at: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            position: { select: { title: true } },
          },
        },
        review: {
          select: {
            id: true,
            campaign: { select: { id: true, title: true, year: true } },
          },
        },
        actions: {
          orderBy: { due_date: 'asc' },
        },
        _count: {
          select: { actions: true },
        },
      },
    });
  }

  async findOne(id: number) {
    const plan = await this.prisma.perf_improvement_plan.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            profile_photo_url: true,
            position: { select: { title: true } },
            department: { select: { department_name: true } },
          },
        },
        manager: {
          select: {
            id: true,
            full_name: true,
          },
        },
        review: {
          select: {
            id: true,
            status: true,
            final_rating: true,
            campaign: { select: { id: true, title: true, year: true } },
          },
        },
        actions: {
          orderBy: { due_date: 'asc' },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Plan d'amélioration #${id} non trouvé`);
    }

    return plan;
  }

  async update(id: number, dto: UpdateImprovementPlanDto, userId: number) {
    const plan = await this.prisma.perf_improvement_plan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`Plan d'amélioration #${id} non trouvé`);
    }

    // Seul le manager peut modifier le plan
    if (plan.manager_id !== userId) {
      throw new ForbiddenException('Seul le manager peut modifier ce plan');
    }

    return this.prisma.perf_improvement_plan.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.reason !== undefined && { reason: dto.reason }),
        ...(dto.start_date && { start_date: new Date(dto.start_date) }),
        ...(dto.end_date && { end_date: new Date(dto.end_date) }),
        ...(dto.status && { status: dto.status }),
      },
      include: {
        actions: true,
      },
    });
  }

  async activate(id: number, userId: number) {
    const plan = await this.prisma.perf_improvement_plan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`Plan d'amélioration #${id} non trouvé`);
    }

    if (plan.manager_id !== userId) {
      throw new ForbiddenException('Seul le manager peut activer ce plan');
    }

    if (plan.status !== 'DRAFT') {
      throw new BadRequestException('Seul un plan en brouillon peut être activé');
    }

    return this.prisma.perf_improvement_plan.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  async complete(id: number, userId: number) {
    const plan = await this.prisma.perf_improvement_plan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`Plan d'amélioration #${id} non trouvé`);
    }

    if (plan.manager_id !== userId) {
      throw new ForbiddenException('Seul le manager peut compléter ce plan');
    }

    if (plan.status !== 'ACTIVE') {
      throw new BadRequestException('Seul un plan actif peut être complété');
    }

    return this.prisma.perf_improvement_plan.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
  }

  async addAction(planId: number, dto: AddActionDto, userId: number) {
    const plan = await this.prisma.perf_improvement_plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan d'amélioration #${planId} non trouvé`);
    }

    if (plan.manager_id !== userId) {
      throw new ForbiddenException('Seul le manager peut ajouter des actions');
    }

    return this.prisma.improvement_action.create({
      data: {
        plan_id: planId,
        title: dto.title,
        description: dto.description,
        due_date: dto.due_date ? new Date(dto.due_date) : null,
        status: 'PENDING',
      },
    });
  }

  async updateAction(
    planId: number,
    actionId: number,
    dto: UpdateActionDto,
    userId: number,
    isManager: boolean,
  ) {
    const plan = await this.prisma.perf_improvement_plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan d'amélioration #${planId} non trouvé`);
    }

    const action = await this.prisma.improvement_action.findUnique({
      where: { id: actionId },
    });

    if (!action || action.plan_id !== planId) {
      throw new NotFoundException(`Action #${actionId} non trouvée dans ce plan`);
    }

    // L'employé peut uniquement mettre à jour ses notes et le statut
    // Le manager peut tout modifier
    const updateData: any = {};

    if (isManager) {
      if (dto.title) updateData.title = dto.title;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.due_date !== undefined) {
        updateData.due_date = dto.due_date ? new Date(dto.due_date) : null;
      }
      if (dto.manager_notes !== undefined) updateData.manager_notes = dto.manager_notes;
    }

    if (dto.status) {
      updateData.status = dto.status;
      if (dto.status === 'COMPLETED') {
        updateData.completed_at = new Date();
      }
    }

    if (dto.employee_notes !== undefined) {
      updateData.employee_notes = dto.employee_notes;
    }

    return this.prisma.improvement_action.update({
      where: { id: actionId },
      data: updateData,
    });
  }

  async deleteAction(planId: number, actionId: number, userId: number) {
    const plan = await this.prisma.perf_improvement_plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan d'amélioration #${planId} non trouvé`);
    }

    if (plan.manager_id !== userId) {
      throw new ForbiddenException('Seul le manager peut supprimer des actions');
    }

    const action = await this.prisma.improvement_action.findUnique({
      where: { id: actionId },
    });

    if (!action || action.plan_id !== planId) {
      throw new NotFoundException(`Action #${actionId} non trouvée dans ce plan`);
    }

    await this.prisma.improvement_action.delete({
      where: { id: actionId },
    });

    return { success: true, message: 'Action supprimée' };
  }

  async getProgress(id: number) {
    const plan = await this.prisma.perf_improvement_plan.findUnique({
      where: { id },
      include: {
        actions: {
          select: { status: true },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Plan d'amélioration #${id} non trouvé`);
    }

    const total = plan.actions.length;
    const completed = plan.actions.filter((a) => a.status === 'COMPLETED').length;
    const inProgress = plan.actions.filter((a) => a.status === 'IN_PROGRESS').length;
    const pending = plan.actions.filter((a) => a.status === 'PENDING').length;

    return {
      total_actions: total,
      completed,
      in_progress: inProgress,
      pending,
      progress_percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }
}
