import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/dto/create-notification.dto';
import { CreateRecognitionDto, RecognitionQueryDto } from '../dto/recognition.dto';

@Injectable()
export class RecognitionService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) { }

  async create(dto: CreateRecognitionDto, fromUserId: number) {
    // Vérifier que le destinataire existe et est actif
    const toUser = await this.prisma.user.findUnique({
      where: { id: dto.to_user_id },
      select: { id: true, full_name: true, active: true },
    });

    if (!toUser || !toUser.active) {
      throw new NotFoundException(`Utilisateur #${dto.to_user_id} non trouvé ou inactif`);
    }

    // Récupérer le nom de l'expéditeur
    const fromUser = await this.prisma.user.findUnique({
      where: { id: fromUserId },
      select: { full_name: true },
    });

    const recognition = await this.prisma.recognition.create({
      data: {
        from_user_id: fromUserId,
        to_user_id: dto.to_user_id,
        type: dto.type || 'KUDOS',
        badge: dto.badge,
        message: dto.message,
        is_public: dto.is_public ?? true,
      },
      include: {
        from_user: {
          select: {
            id: true,
            full_name: true,
            profile_photo_url: true,
            position: { select: { title: true } },
          },
        },
        to_user: {
          select: {
            id: true,
            full_name: true,
            profile_photo_url: true,
            position: { select: { title: true } },
          },
        },
      },
    });

    // Notification au destinataire
    await this.notificationsService.create({
      user_id: dto.to_user_id,
      type: NotificationType.SYSTEM,
      title: 'Nouvelle reconnaissance reçue!',
      message: `${fromUser?.full_name || 'Quelqu\'un'} vous a envoyé ${dto.type === 'BADGE' ? 'un badge' : 'un kudos'}: "${dto.message.substring(0, 50)}${dto.message.length > 50 ? '...' : ''}"`,
      link: `/performance/recognition`,
      entity_type: 'recognition',
      entity_id: recognition.id,
    });

    return recognition;
  }

  async findAll(query: RecognitionQueryDto, user?: any) {
    const { from_user_id, to_user_id, type, is_public, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (from_user_id) where.from_user_id = from_user_id;
    if (to_user_id) where.to_user_id = to_user_id;
    if (type) where.type = type;
    if (is_public !== undefined) where.is_public = is_public;

    if (user && user.company_id) {
      where.to_user = { company_id: user.company_id };
    }

    const [recognitions, total] = await Promise.all([
      this.prisma.recognition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          from_user: {
            select: {
              id: true,
              full_name: true,
              profile_photo_url: true,
              position: { select: { title: true } },
              department: { select: { name: true } },
            },
          },
          to_user: {
            select: {
              id: true,
              full_name: true,
              profile_photo_url: true,
              position: { select: { title: true } },
              department: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.recognition.count({ where }),
    ]);

    return {
      data: recognitions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPublicFeed(page: number = 1, limit: number = 20, user?: any) {
    const skip = (page - 1) * limit;

    const where: any = { is_public: true };
    if (user && user.company_id) {
      where.to_user = { company_id: user.company_id };
    }

    const [recognitions, total] = await Promise.all([
      this.prisma.recognition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          from_user: {
            select: {
              id: true,
              full_name: true,
              profile_photo_url: true,
              position: { select: { title: true } },
            },
          },
          to_user: {
            select: {
              id: true,
              full_name: true,
              profile_photo_url: true,
              position: { select: { title: true } },
            },
          },
        },
      }),
      this.prisma.recognition.count({ where }),
    ]);

    return {
      data: recognitions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findMy(userId: number) {
    const [sent, received] = await Promise.all([
      this.prisma.recognition.findMany({
        where: { from_user_id: userId },
        orderBy: { created_at: 'desc' },
        take: 50,
        include: {
          to_user: {
            select: {
              id: true,
              full_name: true,
              profile_photo_url: true,
              position: { select: { title: true } },
            },
          },
        },
      }),
      this.prisma.recognition.findMany({
        where: { to_user_id: userId },
        orderBy: { created_at: 'desc' },
        take: 50,
        include: {
          from_user: {
            select: {
              id: true,
              full_name: true,
              profile_photo_url: true,
              position: { select: { title: true } },
            },
          },
        },
      }),
    ]);

    return {
      sent,
      received,
      stats: {
        total_sent: sent.length,
        total_received: received.length,
        badges_received: received.filter((r) => r.type === 'BADGE').length,
        kudos_received: received.filter((r) => r.type === 'KUDOS').length,
      },
    };
  }

  async findOne(id: number) {
    const recognition = await this.prisma.recognition.findUnique({
      where: { id },
      include: {
        from_user: {
          select: {
            id: true,
            full_name: true,
            profile_photo_url: true,
            position: { select: { title: true } },
            department: { select: { name: true } },
          },
        },
        to_user: {
          select: {
            id: true,
            full_name: true,
            profile_photo_url: true,
            position: { select: { title: true } },
            department: { select: { name: true } },
          },
        },
      },
    });

    if (!recognition) {
      throw new NotFoundException(`Reconnaissance #${id} non trouvée`);
    }

    return recognition;
  }

  async delete(id: number, userId: number) {
    const recognition = await this.prisma.recognition.findUnique({
      where: { id },
    });

    if (!recognition) {
      throw new NotFoundException(`Reconnaissance #${id} non trouvée`);
    }

    // Seul l'expéditeur peut supprimer
    if (recognition.from_user_id !== userId) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres reconnaissances');
    }

    await this.prisma.recognition.delete({
      where: { id },
    });

    return { success: true, message: 'Reconnaissance supprimée' };
  }

  async getLeaderboard(period: 'week' | 'month' | 'year' = 'month', limit: number = 10, user?: any) {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const where: any = { created_at: { gte: startDate } };
    if (user && user.company_id) {
      where.to_user = { company_id: user.company_id };
    }

    // Compter les reconnaissances reçues par utilisateur
    const recognitions = await this.prisma.recognition.groupBy({
      by: ['to_user_id'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    });

    // Récupérer les informations des utilisateurs
    const userIds = recognitions.map((r) => r.to_user_id);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        full_name: true,
        profile_photo_url: true,
        position: { select: { title: true } },
        department: { select: { name: true } },
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return recognitions.map((r, index) => ({
      rank: index + 1,
      user: userMap.get(r.to_user_id),
      recognition_count: r._count.id,
    }));
  }

  async getBadgesList() {
    // Liste des badges disponibles
    return [
      { id: 'team_player', name: 'Team Player', icon: '🤝', description: 'Excellent esprit d\'équipe' },
      { id: 'innovator', name: 'Innovateur', icon: '💡', description: 'Idées créatives et innovantes' },
      { id: 'helper', name: 'Helper', icon: '🆘', description: 'Toujours prêt à aider' },
      { id: 'mentor', name: 'Mentor', icon: '🎓', description: 'Guide et forme les autres' },
      { id: 'problem_solver', name: 'Problem Solver', icon: '🧩', description: 'Résout les problèmes efficacement' },
      { id: 'quality_champion', name: 'Quality Champion', icon: '⭐', description: 'Travail de haute qualité' },
      { id: 'customer_hero', name: 'Customer Hero', icon: '🦸', description: 'Service client exceptionnel' },
      { id: 'fast_learner', name: 'Fast Learner', icon: '🚀', description: 'Apprentissage rapide' },
      { id: 'communicator', name: 'Communicateur', icon: '💬', description: 'Excellente communication' },
      { id: 'leader', name: 'Leader', icon: '👑', description: 'Leadership exemplaire' },
    ];
  }
}
