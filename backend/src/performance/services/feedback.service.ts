import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/dto/create-notification.dto';
import {
  RequestFeedbackDto,
  SubmitFeedbackDto,
  FeedbackQueryDto,
} from '../dto/feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async requestFeedback(dto: RequestFeedbackDto, requesterId: number) {
    const review = await this.prisma.performance_review.findUnique({
      where: { id: dto.review_id },
      include: {
        employee: { select: { full_name: true } },
        campaign: { select: { title: true } },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review #${dto.review_id} non trouvée`);
    }

    // Seul le manager peut demander des feedbacks
    if (review.manager_id !== requesterId) {
      throw new ForbiddenException('Seul le manager peut demander des feedbacks 360');
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const reviewerId of dto.reviewer_ids) {
      try {
        // Vérifier que le reviewer n'est pas l'employé évalué
        if (reviewerId === review.employee_id) {
          results.errors.push('L\'employé ne peut pas être son propre reviewer');
          results.skipped++;
          continue;
        }

        // Vérifier que le reviewer existe et est actif
        const reviewer = await this.prisma.user.findUnique({
          where: { id: reviewerId },
          select: { id: true, active: true, full_name: true },
        });

        if (!reviewer || !reviewer.active) {
          results.errors.push(`Reviewer #${reviewerId} non trouvé ou inactif`);
          results.skipped++;
          continue;
        }

        // Vérifier si une demande existe déjà
        const existing = await this.prisma.feedback_360_request.findUnique({
          where: {
            review_id_reviewer_id: {
              review_id: dto.review_id,
              reviewer_id: reviewerId,
            },
          },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        await this.prisma.feedback_360_request.create({
          data: {
            review_id: dto.review_id,
            reviewer_id: reviewerId,
            requested_by_id: requesterId,
            is_anonymous: dto.is_anonymous ?? true,
            status: 'PENDING',
          },
        });

        // Notification au reviewer
        await this.notificationsService.create({
          user_id: reviewerId,
          type: NotificationType.SYSTEM,
          title: 'Demande de feedback 360°',
          message: `Vous êtes invité à donner un feedback sur ${review.employee.full_name}`,
          link: `/performance/feedback/pending`,
          entity_type: 'feedback_360_request',
          entity_id: dto.review_id,
        });

        results.created++;
      } catch (error) {
        results.errors.push(`Erreur pour reviewer #${reviewerId}: ${error.message}`);
        results.skipped++;
      }
    }

    return results;
  }

  async findPending(userId: number) {
    return this.prisma.feedback_360_request.findMany({
      where: {
        reviewer_id: userId,
        status: 'PENDING',
      },
      include: {
        review: {
          include: {
            employee: {
              select: {
                id: true,
                full_name: true,
                position: { select: { title: true } },
                department: { select: { department_name: true } },
              },
            },
            campaign: {
              select: { id: true, title: true, year: true },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findByReview(reviewId: number, userId: number) {
    const review = await this.prisma.performance_review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException(`Review #${reviewId} non trouvée`);
    }

    // Seul le manager ou RH peut voir les feedbacks d'une review
    // L'employé NE PEUT PAS voir les feedbacks (anonymat strict)
    if (review.manager_id !== userId) {
      throw new ForbiddenException('Accès non autorisé aux feedbacks');
    }

    const feedbacks = await this.prisma.feedback_360_request.findMany({
      where: { review_id: reviewId },
      include: {
        reviewer: {
          select: {
            id: true,
            full_name: true,
            position: { select: { title: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Masquer les informations du reviewer si anonyme
    return feedbacks.map((f) => ({
      id: f.id,
      status: f.status,
      rating: f.status === 'SUBMITTED' ? f.rating : null,
      responses: f.status === 'SUBMITTED' ? f.responses : null,
      comments: f.status === 'SUBMITTED' ? f.comments : null,
      is_anonymous: f.is_anonymous,
      reviewer: f.is_anonymous
        ? null
        : {
            id: f.reviewer.id,
            full_name: f.reviewer.full_name,
            position: f.reviewer.position?.title,
          },
      submitted_at: f.submitted_at,
      created_at: f.created_at,
    }));
  }

  async getAggregatedFeedback(reviewId: number, userId: number) {
    const review = await this.prisma.performance_review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException(`Review #${reviewId} non trouvée`);
    }

    // Seul le manager peut voir l'agrégation
    if (review.manager_id !== userId) {
      throw new ForbiddenException('Accès non autorisé');
    }

    const feedbacks = await this.prisma.feedback_360_request.findMany({
      where: {
        review_id: reviewId,
        status: 'SUBMITTED',
      },
      select: {
        rating: true,
        responses: true,
        comments: true,
      },
    });

    if (feedbacks.length === 0) {
      return {
        count: 0,
        average_rating: null,
        ratings_distribution: {},
        all_comments: [],
      };
    }

    // Calculer la moyenne
    const ratings = feedbacks.map((f) => f.rating).filter((r) => r !== null) as number[];
    const averageRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;

    // Distribution des notes
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach((r) => {
      distribution[r] = (distribution[r] || 0) + 1;
    });

    // Collecter tous les commentaires (anonymes)
    const allComments = feedbacks
      .map((f) => f.comments)
      .filter((c) => c && c.trim().length > 0);

    return {
      count: feedbacks.length,
      average_rating: averageRating,
      ratings_distribution: distribution,
      all_comments: allComments,
    };
  }

  async submit(id: number, dto: SubmitFeedbackDto, userId: number) {
    const feedback = await this.prisma.feedback_360_request.findUnique({
      where: { id },
      include: {
        review: {
          include: {
            employee: { select: { full_name: true } },
          },
        },
      },
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback #${id} non trouvé`);
    }

    if (feedback.reviewer_id !== userId) {
      throw new ForbiddenException('Ce feedback ne vous est pas destiné');
    }

    if (feedback.status !== 'PENDING') {
      throw new BadRequestException('Ce feedback a déjà été soumis ou décliné');
    }

    const updated = await this.prisma.feedback_360_request.update({
      where: { id },
      data: {
        rating: dto.rating,
        responses: dto.responses ? (dto.responses as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        comments: dto.comments,
        status: 'SUBMITTED',
        submitted_at: new Date(),
      },
    });

    // Notification au manager
    await this.notificationsService.create({
      user_id: feedback.requested_by_id,
      type: NotificationType.SYSTEM,
      title: 'Feedback 360° reçu',
      message: `Un feedback a été soumis pour ${feedback.review.employee.full_name}`,
      link: `/performance/reviews/${feedback.review_id}`,
      entity_type: 'feedback_360_request',
      entity_id: feedback.review_id,
    });

    // Vérifier si tous les feedbacks ont été reçus
    await this.checkAndUpdateReviewStatus(feedback.review_id);

    return updated;
  }

  async decline(id: number, userId: number) {
    const feedback = await this.prisma.feedback_360_request.findUnique({
      where: { id },
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback #${id} non trouvé`);
    }

    if (feedback.reviewer_id !== userId) {
      throw new ForbiddenException('Ce feedback ne vous est pas destiné');
    }

    if (feedback.status !== 'PENDING') {
      throw new BadRequestException('Ce feedback a déjà été traité');
    }

    const updated = await this.prisma.feedback_360_request.update({
      where: { id },
      data: {
        status: 'DECLINED',
      },
    });

    // Vérifier si tous les feedbacks ont été traités
    await this.checkAndUpdateReviewStatus(feedback.review_id);

    return updated;
  }

  private async checkAndUpdateReviewStatus(reviewId: number) {
    const review = await this.prisma.performance_review.findUnique({
      where: { id: reviewId },
      include: {
        feedback_requests: {
          select: { status: true },
        },
      },
    });

    if (!review || review.status !== 'PENDING_FEEDBACK') {
      return;
    }

    // Vérifier si tous les feedbacks ont été traités (soumis ou déclinés)
    const allProcessed = review.feedback_requests.every(
      (f) => f.status !== 'PENDING',
    );

    if (allProcessed) {
      await this.prisma.performance_review.update({
        where: { id: reviewId },
        data: { status: 'PENDING_FINAL' },
      });
    }
  }

  async cancelRequest(id: number, userId: number) {
    const feedback = await this.prisma.feedback_360_request.findUnique({
      where: { id },
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback #${id} non trouvé`);
    }

    if (feedback.requested_by_id !== userId) {
      throw new ForbiddenException('Seul le demandeur peut annuler cette demande');
    }

    if (feedback.status !== 'PENDING') {
      throw new BadRequestException('Impossible d\'annuler un feedback déjà traité');
    }

    await this.prisma.feedback_360_request.delete({
      where: { id },
    });

    return { success: true, message: 'Demande de feedback annulée' };
  }
}
