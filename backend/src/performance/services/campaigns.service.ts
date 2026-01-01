import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { MailService } from '../../mail/mail.service';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignQueryDto,
} from '../dto/campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private mailService: MailService,
  ) { }

  async create(dto: CreateCampaignDto, creatorId: number) {
    // Valider que les pondérations totalisent 100%
    const weightSelf = dto.weight_self ?? 20;
    const weightManager = dto.weight_manager ?? 50;
    const weightFeedback = dto.weight_feedback360 ?? 30;

    if (weightSelf + weightManager + weightFeedback !== 100) {
      throw new BadRequestException(
        'Les pondérations doivent totaliser 100%',
      );
    }

    return this.prisma.performance_campaign.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type || 'ANNUAL',
        year: dto.year,
        start_date: new Date(dto.start_date),
        end_date: new Date(dto.end_date),
        self_review_deadline: dto.self_review_deadline
          ? new Date(dto.self_review_deadline)
          : null,
        manager_review_deadline: dto.manager_review_deadline
          ? new Date(dto.manager_review_deadline)
          : null,
        weight_self: weightSelf,
        weight_manager: weightManager,
        weight_feedback360: weightFeedback,
        created_by_id: creatorId,
      },
      include: {
        creator: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
    });
  }

  async findAll(query: CampaignQueryDto) {
    const { year, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (year) where.year = year;
    if (status) where.status = status;

    const [campaigns, total] = await Promise.all([
      this.prisma.performance_campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              full_name: true,
            },
          },
          _count: {
            select: { reviews: true },
          },
        },
      }),
      this.prisma.performance_campaign.count({ where }),
    ]);

    return {
      data: campaigns,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const campaign = await this.prisma.performance_campaign.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            full_name: true,
          },
        },
        reviews: {
          include: {
            employee: {
              select: {
                id: true,
                full_name: true,
                position: { select: { title: true } },
                department: { select: { name: true } },
              },
            },
            manager: {
              select: {
                id: true,
                full_name: true,
              },
            },
          },
        },
        _count: {
          select: { reviews: true },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Campagne #${id} non trouvée`);
    }

    return campaign;
  }

  async update(id: number, dto: UpdateCampaignDto) {
    const campaign = await this.prisma.performance_campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException(`Campagne #${id} non trouvée`);
    }

    // Valider les pondérations si modifiées
    const weightSelf = dto.weight_self ?? campaign.weight_self;
    const weightManager = dto.weight_manager ?? campaign.weight_manager;
    const weightFeedback = dto.weight_feedback360 ?? campaign.weight_feedback360;

    if (
      dto.weight_self !== undefined ||
      dto.weight_manager !== undefined ||
      dto.weight_feedback360 !== undefined
    ) {
      if (weightSelf + weightManager + weightFeedback !== 100) {
        throw new BadRequestException(
          'Les pondérations doivent totaliser 100%',
        );
      }
    }

    return this.prisma.performance_campaign.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.type && { type: dto.type }),
        ...(dto.year && { year: dto.year }),
        ...(dto.start_date && { start_date: new Date(dto.start_date) }),
        ...(dto.end_date && { end_date: new Date(dto.end_date) }),
        ...(dto.self_review_deadline !== undefined && {
          self_review_deadline: dto.self_review_deadline
            ? new Date(dto.self_review_deadline)
            : null,
        }),
        ...(dto.manager_review_deadline !== undefined && {
          manager_review_deadline: dto.manager_review_deadline
            ? new Date(dto.manager_review_deadline)
            : null,
        }),
        ...(dto.weight_self !== undefined && { weight_self: weightSelf }),
        ...(dto.weight_manager !== undefined && { weight_manager: weightManager }),
        ...(dto.weight_feedback360 !== undefined && {
          weight_feedback360: weightFeedback,
        }),
        ...(dto.status && { status: dto.status }),
      },
      include: {
        creator: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
    });
  }

  async launch(id: number) {
    const campaign = await this.prisma.performance_campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException(`Campagne #${id} non trouvée`);
    }

    if (campaign.status !== 'DRAFT') {
      throw new BadRequestException(
        'Seule une campagne en brouillon peut être lancée',
      );
    }

    // 1. Mettre à jour le statut de la campagne
    const updatedCampaign = await this.prisma.performance_campaign.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    // 2. Récupérer tous les utilisateurs actifs pour créer leurs reviews
    const activeUsers = await this.prisma.user.findMany({
      where: { active: true },
      select: {
        id: true,
        full_name: true,
        work_email: true,
        manager_user_id: true,
      },
    });

    // 3. Créer les évaluations (Reviews)
    const reviewsToCreate = activeUsers.map((user) => {
      // Déterminer le manager pour l'évaluation :
      // 1. Le manager assigné à l'utilisateur
      // 2. Sinon, le créateur de la campagne (sert de fallback pour le CEO ou admin)
      // 3. Sinon, l'utilisateur lui-même (dernier recours, mais rare si creatorId est présent)
      const managerId = user.manager_user_id || campaign.created_by_id;

      return {
        campaign_id: campaign.id,
        employee_id: user.id,
        manager_id: managerId,
        status: 'PENDING_SELF' as const, // Forcer le type enum ou string exact
      };
    });

    // Utiliser createMany pour la performance (insère en lot)
    if (reviewsToCreate.length > 0) {
      await this.prisma.performance_review.createMany({
        data: reviewsToCreate,
        skipDuplicates: true, // Évite de planter si une review existe déjà
      });
    }

    // 4. Notifications : Adapter le message pour "Votre évaluation est prête"

    // 🔔 Notifications In-App
    await this.notificationsService.notifyCampaignLaunched(
      campaign.id,
      campaign.title,
      campaign.description || '',
      campaign.start_date,
      campaign.end_date,
    );
    // Note: notifyCampaignLaunched a été mis à jour (conceptuellement) ou on peut le garder générique.
    // Pour être plus précis, on pourrait ajouter un paramètre ou changer le message dans le service.
    // Pour l'instant, le message "Campagne lancée" est correct, mais l'email sera plus explicite.

    // 📧 Emails
    Promise.all(
      activeUsers
        .filter(user => user.work_email)
        .map(user => {
          const [firstName, ...lastNameParts] = user.full_name.split(' ');
          return this.mailService.sendCampaignLaunchedEmail(
            {
              email: user.work_email,
              firstName: firstName || user.full_name,
              lastName: lastNameParts.join(' ') || '',
            },
            {
              title: campaign.title,
              description: campaign.description,
              type: campaign.type,
              start_date: campaign.start_date,
              end_date: campaign.end_date,
              self_review_deadline: campaign.self_review_deadline,
              manager_review_deadline: campaign.manager_review_deadline,
            },
          );
        })
    ).catch(err => {
      console.error('Erreur lors de l\'envoi des emails de campagne:', err);
    });

    return {
      ...updatedCampaign,
      reviewsCreated: reviewsToCreate.length,
    };
  }

  async close(id: number) {
    const campaign = await this.prisma.performance_campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException(`Campagne #${id} non trouvée`);
    }

    if (campaign.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Seule une campagne active peut être clôturée',
      );
    }

    return this.prisma.performance_campaign.update({
      where: { id },
      data: { status: 'CLOSED' },
    });
  }

  async remove(id: number) {
    const campaign = await this.prisma.performance_campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException(`Campagne #${id} non trouvée`);
    }

    return this.prisma.performance_campaign.delete({
      where: { id },
    });
  }

  async getStats(id: number) {
    const campaign = await this.prisma.performance_campaign.findUnique({
      where: { id },
      include: {
        reviews: {
          select: { status: true },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Campagne #${id} non trouvée`);
    }

    const stats = {
      total_reviews: campaign.reviews.length,
      pending_self: 0,
      pending_manager: 0,
      pending_feedback: 0,
      pending_final: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const review of campaign.reviews) {
      switch (review.status) {
        case 'PENDING_SELF':
          stats.pending_self++;
          break;
        case 'PENDING_MANAGER':
          stats.pending_manager++;
          break;
        case 'PENDING_FEEDBACK':
          stats.pending_feedback++;
          break;
        case 'PENDING_FINAL':
          stats.pending_final++;
          break;
        case 'COMPLETED':
          stats.completed++;
          break;
        case 'CANCELLED':
          stats.cancelled++;
          break;
      }
    }

    return stats;
  }
}
