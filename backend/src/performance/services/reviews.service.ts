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
  CreateReviewDto,
  CreateBulkReviewsDto,
  SubmitSelfReviewDto,
  SubmitManagerReviewDto,
  FinalizeReviewDto,
  ReviewQueryDto,
} from '../dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  private readonly userSelect = {
    id: true,
    full_name: true,
    profile_photo_url: true,
    work_email: true,
    position: { select: { title: true } },
    department: { select: { name: true } },
  };

  async create(dto: CreateReviewDto) {
    // Vérifier que la campagne existe et est active
    const campaign = await this.prisma.performance_campaign.findUnique({
      where: { id: dto.campaign_id },
    });

    if (!campaign) {
      throw new NotFoundException(`Campagne #${dto.campaign_id} non trouvée`);
    }

    if (campaign.status !== 'ACTIVE' && campaign.status !== 'DRAFT') {
      throw new BadRequestException(
        'Impossible de créer une review pour une campagne clôturée',
      );
    }

    // Vérifier que l'employé existe
    const employee = await this.prisma.user.findUnique({
      where: { id: dto.employee_id },
    });

    if (!employee || !employee.active) {
      throw new NotFoundException(`Employé #${dto.employee_id} non trouvé ou inactif`);
    }

    // Vérifier que le manager existe
    const manager = await this.prisma.user.findUnique({
      where: { id: dto.manager_id },
    });

    if (!manager || !manager.active) {
      throw new NotFoundException(`Manager #${dto.manager_id} non trouvé ou inactif`);
    }

    const review = await this.prisma.performance_review.create({
      data: {
        campaign_id: dto.campaign_id,
        employee_id: dto.employee_id,
        manager_id: dto.manager_id,
        status: 'PENDING_SELF',
      },
      include: {
        campaign: {
          select: { id: true, title: true, year: true },
        },
        employee: { select: this.userSelect },
        manager: { select: this.userSelect },
      },
    });

    // Notification à l'employé
    await this.notificationsService.create({
      user_id: dto.employee_id,
      type: NotificationType.SYSTEM,
      title: 'Nouvelle évaluation de performance',
      message: `Vous avez une nouvelle évaluation à compléter pour la campagne "${campaign.title}"`,
      link: `/performance/reviews/${review.id}`,
      entity_type: 'performance_review',
      entity_id: review.id,
    });

    return review;
  }

  async createBulk(dto: CreateBulkReviewsDto, requesterId: number) {
    const campaign = await this.prisma.performance_campaign.findUnique({
      where: { id: dto.campaign_id },
    });

    if (!campaign) {
      throw new NotFoundException(`Campagne #${dto.campaign_id} non trouvée`);
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const employeeId of dto.employee_ids) {
      try {
        const employee = await this.prisma.user.findUnique({
          where: { id: employeeId },
          select: { id: true, manager_user_id: true, active: true },
        });

        if (!employee || !employee.active) {
          results.errors.push(`Employé #${employeeId} non trouvé ou inactif`);
          results.skipped++;
          continue;
        }

        if (!employee.manager_user_id) {
          results.errors.push(`Employé #${employeeId} n'a pas de manager assigné`);
          results.skipped++;
          continue;
        }

        // Vérifier si une review existe déjà
        const existing = await this.prisma.performance_review.findUnique({
          where: {
            campaign_id_employee_id: {
              campaign_id: dto.campaign_id,
              employee_id: employeeId,
            },
          },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        await this.prisma.performance_review.create({
          data: {
            campaign_id: dto.campaign_id,
            employee_id: employeeId,
            manager_id: employee.manager_user_id,
            status: 'PENDING_SELF',
          },
        });

        results.created++;
      } catch (error) {
        results.errors.push(`Erreur pour employé #${employeeId}: ${error.message}`);
        results.skipped++;
      }
    }

    return results;
  }

  async findAll(query: ReviewQueryDto) {
    const { campaign_id, employee_id, manager_id, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (campaign_id) where.campaign_id = campaign_id;
    if (employee_id) where.employee_id = employee_id;
    if (manager_id) where.manager_id = manager_id;
    if (status) where.status = status;

    const [reviews, total] = await Promise.all([
      this.prisma.performance_review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          campaign: {
            select: { id: true, title: true, year: true, type: true },
          },
          employee: { select: this.userSelect },
          manager: { select: this.userSelect },
          _count: {
            select: {
              objectives: true,
              feedback_requests: true,
            },
          },
        },
      }),
      this.prisma.performance_review.count({ where }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findMy(userId: number) {
    return this.prisma.performance_review.findMany({
      where: { employee_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            year: true,
            type: true,
            self_review_deadline: true,
          },
        },
        manager: { select: this.userSelect },
        objectives: {
          include: {
            key_results: true,
          },
        },
        _count: {
          select: { feedback_requests: true },
        },
      },
    });
  }

  async findTeam(managerId: number) {
    return this.prisma.performance_review.findMany({
      where: { manager_id: managerId },
      orderBy: { created_at: 'desc' },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            year: true,
            type: true,
            manager_review_deadline: true,
          },
        },
        employee: { select: this.userSelect },
        objectives: {
          include: {
            key_results: true,
          },
        },
        feedback_requests: {
          select: {
            id: true,
            status: true,
            rating: true,
          },
        },
        _count: {
          select: { feedback_requests: true },
        },
      },
    });
  }

  async findOne(id: number) {
    const review = await this.prisma.performance_review.findUnique({
      where: { id },
      include: {
        campaign: true,
        employee: { select: this.userSelect },
        manager: { select: this.userSelect },
        objectives: {
          include: {
            key_results: true,
          },
        },
        feedback_requests: {
          include: {
            reviewer: {
              select: {
                id: true,
                full_name: true,
              },
            },
          },
        },
        improvement_plan: {
          include: {
            actions: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review #${id} non trouvée`);
    }

    return review;
  }

  async submitSelfReview(id: number, dto: SubmitSelfReviewDto, userId: number) {
    const review = await this.prisma.performance_review.findUnique({
      where: { id },
      include: { campaign: true },
    });

    if (!review) {
      throw new NotFoundException(`Review #${id} non trouvée`);
    }

    if (review.employee_id !== userId) {
      throw new ForbiddenException('Vous ne pouvez soumettre que votre propre évaluation');
    }

    if (review.status !== 'PENDING_SELF') {
      throw new BadRequestException('Cette review n\'est plus en attente d\'auto-évaluation');
    }

    const updated = await this.prisma.performance_review.update({
      where: { id },
      data: {
        self_rating: dto.self_rating,
        self_comments: dto.self_comments,
        self_submitted_at: new Date(),
        status: 'PENDING_MANAGER',
      },
      include: {
        campaign: { select: { title: true } },
        employee: { select: { full_name: true } },
      },
    });

    // Notification au manager
    await this.notificationsService.create({
      user_id: review.manager_id,
      type: NotificationType.SYSTEM,
      title: 'Auto-évaluation soumise',
      message: `${updated.employee.full_name} a soumis son auto-évaluation`,
      link: `/performance/reviews/${id}`,
      entity_type: 'performance_review',
      entity_id: id,
    });

    return updated;
  }

  async submitManagerReview(id: number, dto: SubmitManagerReviewDto, userId: number) {
    const review = await this.prisma.performance_review.findUnique({
      where: { id },
      include: {
        feedback_requests: { where: { status: 'PENDING' } },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review #${id} non trouvée`);
    }

    if (review.manager_id !== userId) {
      throw new ForbiddenException('Vous n\'êtes pas le manager de cette review');
    }

    if (review.status !== 'PENDING_MANAGER') {
      throw new BadRequestException('Cette review n\'est pas en attente d\'évaluation manager');
    }

    // Déterminer le prochain statut
    let nextStatus: 'PENDING_FEEDBACK' | 'PENDING_FINAL' = 'PENDING_FINAL';
    if (review.feedback_requests.length > 0) {
      nextStatus = 'PENDING_FEEDBACK';
    }

    const updated = await this.prisma.performance_review.update({
      where: { id },
      data: {
        manager_rating: dto.manager_rating,
        manager_comments: dto.manager_comments,
        manager_submitted_at: new Date(),
        status: nextStatus,
      },
    });

    // Notification à l'employé
    await this.notificationsService.create({
      user_id: review.employee_id,
      type: NotificationType.SYSTEM,
      title: 'Évaluation manager soumise',
      message: 'Votre manager a soumis son évaluation',
      link: `/performance/reviews/${id}`,
      entity_type: 'performance_review',
      entity_id: id,
    });

    return updated;
  }

  async finalize(id: number, dto: FinalizeReviewDto, userId: number) {
    const review = await this.prisma.performance_review.findUnique({
      where: { id },
      include: { campaign: true },
    });

    if (!review) {
      throw new NotFoundException(`Review #${id} non trouvée`);
    }

    if (review.manager_id !== userId) {
      throw new ForbiddenException('Seul le manager peut finaliser cette review');
    }

    if (review.status !== 'PENDING_FINAL' && review.status !== 'PENDING_FEEDBACK') {
      throw new BadRequestException('Cette review ne peut pas encore être finalisée');
    }

    const updated = await this.prisma.performance_review.update({
      where: { id },
      data: {
        final_rating: dto.final_rating,
        final_comments: dto.final_comments,
        finalized_at: new Date(),
        status: 'COMPLETED',
      },
    });

    // Notification à l'employé
    await this.notificationsService.create({
      user_id: review.employee_id,
      type: NotificationType.SYSTEM,
      title: 'Évaluation finalisée',
      message: 'Votre évaluation annuelle a été finalisée',
      link: `/performance/reviews/${id}`,
      entity_type: 'performance_review',
      entity_id: id,
    });

    return updated;
  }

  async calculateFinalScore(id: number) {
    const review = await this.prisma.performance_review.findUnique({
      where: { id },
      include: {
        campaign: true,
        feedback_requests: {
          where: { status: 'SUBMITTED' },
          select: { rating: true },
        },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review #${id} non trouvée`);
    }

    const { weight_self, weight_manager, weight_feedback360 } = review.campaign;

    let score = 0;
    let totalWeight = 0;

    if (review.self_rating) {
      score += review.self_rating * weight_self;
      totalWeight += weight_self;
    }

    if (review.manager_rating) {
      score += review.manager_rating * weight_manager;
      totalWeight += weight_manager;
    }

    if (review.feedback_requests.length > 0) {
      const avgFeedback =
        review.feedback_requests.reduce((sum, f) => sum + (f.rating || 0), 0) /
        review.feedback_requests.length;
      score += avgFeedback * weight_feedback360;
      totalWeight += weight_feedback360;
    }

    const finalScore = totalWeight > 0 ? Math.round((score / totalWeight) * 10) / 10 : null;

    return {
      self_rating: review.self_rating,
      manager_rating: review.manager_rating,
      feedback_avg:
        review.feedback_requests.length > 0
          ? review.feedback_requests.reduce((sum, f) => sum + (f.rating || 0), 0) /
            review.feedback_requests.length
          : null,
      weights: {
        self: weight_self,
        manager: weight_manager,
        feedback360: weight_feedback360,
      },
      calculated_score: finalScore,
    };
  }
}
