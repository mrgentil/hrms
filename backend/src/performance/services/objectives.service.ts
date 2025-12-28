import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateObjectiveDto,
  UpdateObjectiveDto,
  UpdateProgressDto,
  LinkObjectiveToReviewDto,
  ObjectiveQueryDto,
} from '../dto/objective.dto';

@Injectable()
export class ObjectivesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateObjectiveDto, creatorId: number) {
    // Si lié à une review, vérifier que l'utilisateur est manager
    if (dto.review_id) {
      const review = await this.prisma.performance_review.findUnique({
        where: { id: dto.review_id },
      });

      if (!review) {
        throw new NotFoundException(`Review #${dto.review_id} non trouvée`);
      }

      if (review.manager_id !== creatorId && review.employee_id !== dto.employee_id) {
        throw new ForbiddenException('Non autorisé à créer des objectifs pour cette review');
      }
    }

    // Créer l'objectif avec les key results
    const objective = await this.prisma.performance_objective.create({
      data: {
        review_id: dto.review_id,
        employee_id: dto.employee_id,
        title: dto.title,
        description: dto.description,
        type: dto.type || 'INDIVIDUAL',
        category: dto.category,
        metric_type: dto.metric_type || 'PERCENTAGE',
        target_value: dto.target_value,
        current_value: dto.current_value || 0,
        weight: dto.weight || 100,
        start_date: new Date(dto.start_date),
        due_date: new Date(dto.due_date),
        status: 'NOT_STARTED',
        key_results: dto.key_results?.length
          ? {
              create: dto.key_results.map((kr) => ({
                title: kr.title,
                target_value: kr.target_value,
                current_value: kr.current_value || 0,
                unit: kr.unit,
                status: 'NOT_STARTED',
              })),
            }
          : undefined,
      },
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
          },
        },
        key_results: true,
      },
    });

    return objective;
  }

  async findAll(query: ObjectiveQueryDto) {
    const { employee_id, review_id, status, type, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (employee_id) where.employee_id = employee_id;
    if (review_id) where.review_id = review_id;
    if (status) where.status = status;
    if (type) where.type = type;

    const [objectives, total] = await Promise.all([
      this.prisma.performance_objective.findMany({
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
            },
          },
          review: {
            select: {
              id: true,
              campaign: {
                select: { id: true, title: true, year: true },
              },
            },
          },
          key_results: true,
        },
      }),
      this.prisma.performance_objective.count({ where }),
    ]);

    return {
      data: objectives,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findMy(userId: number) {
    return this.prisma.performance_objective.findMany({
      where: { employee_id: userId },
      orderBy: [{ status: 'asc' }, { due_date: 'asc' }],
      include: {
        review: {
          select: {
            id: true,
            campaign: {
              select: { id: true, title: true, year: true },
            },
          },
        },
        key_results: true,
      },
    });
  }

  async findTeam(managerId: number) {
    // Récupérer les IDs des employés gérés par ce manager
    const employees = await this.prisma.user.findMany({
      where: { manager_user_id: managerId, active: true },
      select: { id: true },
    });

    const employeeIds = employees.map((e) => e.id);

    return this.prisma.performance_objective.findMany({
      where: { employee_id: { in: employeeIds } },
      orderBy: [{ status: 'asc' }, { due_date: 'asc' }],
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
            campaign: {
              select: { id: true, title: true, year: true },
            },
          },
        },
        key_results: true,
      },
    });
  }

  async findOne(id: number) {
    const objective = await this.prisma.performance_objective.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            position: { select: { title: true } },
            department: { select: { department_name: true } },
          },
        },
        review: {
          select: {
            id: true,
            status: true,
            campaign: {
              select: { id: true, title: true, year: true },
            },
          },
        },
        key_results: true,
      },
    });

    if (!objective) {
      throw new NotFoundException(`Objectif #${id} non trouvé`);
    }

    return objective;
  }

  async update(id: number, dto: UpdateObjectiveDto, userId: number) {
    const objective = await this.prisma.performance_objective.findUnique({
      where: { id },
      include: { review: true },
    });

    if (!objective) {
      throw new NotFoundException(`Objectif #${id} non trouvé`);
    }

    // Vérifier les droits
    const isOwner = objective.employee_id === userId;
    const isManager = objective.review?.manager_id === userId;

    if (!isOwner && !isManager) {
      throw new ForbiddenException('Non autorisé à modifier cet objectif');
    }

    return this.prisma.performance_objective.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.type && { type: dto.type }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.metric_type && { metric_type: dto.metric_type }),
        ...(dto.target_value !== undefined && { target_value: dto.target_value }),
        ...(dto.current_value !== undefined && { current_value: dto.current_value }),
        ...(dto.weight !== undefined && { weight: dto.weight }),
        ...(dto.start_date && { start_date: new Date(dto.start_date) }),
        ...(dto.due_date && { due_date: new Date(dto.due_date) }),
        ...(dto.status && { status: dto.status }),
        ...(dto.status === 'COMPLETED' && { completed_at: new Date() }),
      },
      include: {
        key_results: true,
      },
    });
  }

  async updateProgress(id: number, dto: UpdateProgressDto, userId: number, isManager: boolean) {
    const objective = await this.prisma.performance_objective.findUnique({
      where: { id },
    });

    if (!objective) {
      throw new NotFoundException(`Objectif #${id} non trouvé`);
    }

    // Déterminer si c'est l'employé ou le manager qui met à jour
    const updateData: any = {};

    if (isManager) {
      updateData.manager_progress = dto.progress;
      updateData.manager_comments = dto.comments;
    } else {
      if (objective.employee_id !== userId) {
        throw new ForbiddenException('Non autorisé');
      }
      updateData.self_progress = dto.progress;
      updateData.self_comments = dto.comments;
    }

    if (dto.current_value !== undefined) {
      updateData.current_value = dto.current_value;
    }

    // Mettre à jour le statut si progression à 100%
    if (dto.progress === 100) {
      updateData.status = 'COMPLETED';
      updateData.completed_at = new Date();
    } else if (dto.progress > 0 && objective.status === 'NOT_STARTED') {
      updateData.status = 'IN_PROGRESS';
    }

    return this.prisma.performance_objective.update({
      where: { id },
      data: updateData,
      include: {
        key_results: true,
      },
    });
  }

  async linkToReview(id: number, dto: LinkObjectiveToReviewDto, userId: number) {
    const objective = await this.prisma.performance_objective.findUnique({
      where: { id },
    });

    if (!objective) {
      throw new NotFoundException(`Objectif #${id} non trouvé`);
    }

    if (objective.review_id) {
      throw new BadRequestException('Cet objectif est déjà lié à une review');
    }

    const review = await this.prisma.performance_review.findUnique({
      where: { id: dto.review_id },
    });

    if (!review) {
      throw new NotFoundException(`Review #${dto.review_id} non trouvée`);
    }

    if (review.employee_id !== objective.employee_id) {
      throw new BadRequestException(
        'L\'objectif et la review doivent appartenir au même employé',
      );
    }

    return this.prisma.performance_objective.update({
      where: { id },
      data: { review_id: dto.review_id },
      include: {
        review: {
          select: {
            id: true,
            campaign: { select: { id: true, title: true } },
          },
        },
        key_results: true,
      },
    });
  }

  async delete(id: number, userId: number) {
    const objective = await this.prisma.performance_objective.findUnique({
      where: { id },
      include: { review: true },
    });

    if (!objective) {
      throw new NotFoundException(`Objectif #${id} non trouvé`);
    }

    // Seul le manager peut supprimer
    if (objective.review && objective.review.manager_id !== userId) {
      throw new ForbiddenException('Seul le manager peut supprimer cet objectif');
    }

    await this.prisma.performance_objective.delete({
      where: { id },
    });

    return { success: true, message: 'Objectif supprimé' };
  }

  async addKeyResult(objectiveId: number, data: { title: string; target_value?: number; unit?: string }) {
    const objective = await this.prisma.performance_objective.findUnique({
      where: { id: objectiveId },
    });

    if (!objective) {
      throw new NotFoundException(`Objectif #${objectiveId} non trouvé`);
    }

    return this.prisma.objective_key_result.create({
      data: {
        objective_id: objectiveId,
        title: data.title,
        target_value: data.target_value,
        current_value: 0,
        unit: data.unit,
        status: 'NOT_STARTED',
      },
    });
  }

  async updateKeyResult(
    krId: number,
    data: { title?: string; target_value?: number; current_value?: number; status?: string },
  ) {
    return this.prisma.objective_key_result.update({
      where: { id: krId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.target_value !== undefined && { target_value: data.target_value }),
        ...(data.current_value !== undefined && { current_value: data.current_value }),
        ...(data.status && { status: data.status as any }),
      },
    });
  }

  async deleteKeyResult(krId: number) {
    await this.prisma.objective_key_result.delete({
      where: { id: krId },
    });

    return { success: true };
  }
}
