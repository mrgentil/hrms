import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/dto/create-notification.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AnnouncementsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
    private mailService: MailService,
  ) {}

  async create(createAnnouncementDto: CreateAnnouncementDto, authorId: number) {
    // Si aucun département n'est sélectionné, l'annonce est pour tous
    const targetAll = !createAnnouncementDto.department_id;
    
    const announcement = await this.prisma.announcement.create({
      data: {
        ...createAnnouncementDto,
        author_id: authorId,
        target_all: targetAll,
        publish_date: createAnnouncementDto.publish_date 
          ? new Date(createAnnouncementDto.publish_date) 
          : createAnnouncementDto.is_published ? new Date() : null,
        expire_date: createAnnouncementDto.expire_date 
          ? new Date(createAnnouncementDto.expire_date) 
          : null,
      },
      include: {
        author: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
        department: {
          select: { id: true, department_name: true },
        },
      },
    });

    // Log de création
    await this.auditService.logCreate(authorId, 'announcement', announcement.id, {
      title: announcement.title,
      type: announcement.type,
    });

    return announcement;
  }

  async findAll(params?: {
    is_published?: boolean;
    type?: string;
    department_id?: number;
    include_expired?: boolean;
  }) {
    const where: any = {};
    const andConditions: any[] = [];

    if (params?.is_published !== undefined) {
      where.is_published = params.is_published;
    }

    if (params?.type) {
      where.type = params.type;
    }

    if (params?.department_id) {
      andConditions.push({
        OR: [
          { target_all: true },
          { department_id: params.department_id },
        ],
      });
    }

    // Par défaut, exclure les annonces expirées
    if (!params?.include_expired) {
      andConditions.push({
        OR: [
          { expire_date: null },
          { expire_date: { gte: new Date() } },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    console.log('findAll where:', JSON.stringify(where, null, 2));

    // DEBUG: Compter toutes les annonces sans filtre
    const totalCount = await this.prisma.announcement.count();
    console.log('Total announcements in DB:', totalCount);

    return this.prisma.announcement.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { publish_date: 'desc' },
        { created_at: 'desc' },
      ],
      include: {
        author: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
        department: {
          select: { id: true, department_name: true },
        },
        _count: {
          select: { reads: true },
        },
      },
    });
  }

  // Annonces publiées pour un utilisateur
  async findPublishedForUser(userId: number, departmentId?: number) {
    const where: any = {
      is_published: true,
      OR: [
        { expire_date: null },
        { expire_date: { gte: new Date() } },
      ],
    };

    if (departmentId) {
      where.AND = [
        {
          OR: [
            { target_all: true },
            { department_id: departmentId },
          ],
        },
      ];
    }

    const announcements = await this.prisma.announcement.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { publish_date: 'desc' },
      ],
      include: {
        author: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
        department: {
          select: { id: true, department_name: true },
        },
        reads: {
          where: { user_id: userId },
          select: { read_at: true },
        },
      },
    });

    return announcements.map(a => ({
      ...a,
      is_read: a.reads.length > 0,
      read_at: a.reads[0]?.read_at || null,
      reads: undefined,
    }));
  }

  async findOne(id: number) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
        department: {
          select: { id: true, department_name: true },
        },
        _count: {
          select: { reads: true },
        },
      },
    });

    if (!announcement) {
      throw new NotFoundException('Annonce non trouvée');
    }

    return announcement;
  }

  async update(id: number, updateAnnouncementDto: UpdateAnnouncementDto) {
    const existing = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Annonce non trouvée');
    }

    const data: any = { ...updateAnnouncementDto };

    if (updateAnnouncementDto.publish_date) {
      data.publish_date = new Date(updateAnnouncementDto.publish_date);
    }
    if (updateAnnouncementDto.expire_date) {
      data.expire_date = new Date(updateAnnouncementDto.expire_date);
    }

    return this.prisma.announcement.update({
      where: { id },
      data,
      include: {
        author: {
          select: { id: true, full_name: true },
        },
        department: {
          select: { id: true, department_name: true },
        },
      },
    });
  }

  async publish(id: number) {
    const existing = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, full_name: true },
        },
        department: {
          select: { id: true, department_name: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Annonce non trouvée');
    }

    const published = await this.prisma.announcement.update({
      where: { id },
      data: {
        is_published: true,
        publish_date: new Date(),
      },
    });

    const shouldNotifyAll = existing.target_all || existing.department_id === null;

    const recipients = await this.prisma.user.findMany({
      where: {
        active: true,
        ...(shouldNotifyAll
          ? {}
          : {
              department_id: existing.department_id ?? undefined,
            }),
      },
      select: {
        id: true,
        full_name: true,
        work_email: true,
      },
    });

    const recipientsWithoutAuthor = recipients.filter((u) => u.id !== existing.author_id);
    const link = `/employees/announcements`;
    const title = 'Nouvelle annonce';
    const message = `${existing.author?.full_name ?? 'Un utilisateur'} a publié : "${existing.title}"`;

    if (recipientsWithoutAuthor.length > 0) {
      await this.notificationsService.createMany(
        recipientsWithoutAuthor.map((user) => ({
          user_id: user.id,
          type: NotificationType.ANNOUNCEMENT,
          title,
          message,
          link,
          entity_type: 'announcement',
          entity_id: existing.id,
        })),
      );
    }

    const emailRecipients = recipientsWithoutAuthor
      .map((user) => ({ email: user.work_email?.trim() || null, name: user.full_name }))
      .filter((user) => !!user.email);

    if (emailRecipients.length > 0) {
      const audienceLabel = shouldNotifyAll
        ? 'toute l\'entreprise'
        : existing.department?.department_name
          ? `le département ${existing.department.department_name}`
          : 'votre département';

      const subject = `Nouvelle annonce publiée - ${existing.title}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px;">
          <h2 style="margin: 0 0 12px;">Nouvelle annonce</h2>
          <p style="margin: 0 0 12px;">Une annonce a été publiée pour <strong>${audienceLabel}</strong>.</p>
          <p style="margin: 0 0 12px;"><strong>Titre :</strong> ${existing.title}</p>
          <p style="margin: 0 0 12px;"><strong>Auteur :</strong> ${existing.author?.full_name ?? 'n/a'}</p>
          <p style="margin: 0 0 16px; white-space: pre-line;"><strong>Contenu :</strong><br/>${existing.content}</p>
          <p style="margin: 0;">Consulter dans l'application : <a href="${link}">${link}</a></p>
        </div>
      `;

      await Promise.all(
        emailRecipients.map((recipient) =>
          this.mailService.sendMail({
            to: recipient.email,
            subject,
            html,
          }),
        ),
      );
    }

    return published;
  }

  async unpublish(id: number) {
    return this.prisma.announcement.update({
      where: { id },
      data: {
        is_published: false,
      },
    });
  }

  async markAsRead(announcementId: number, userId: number) {
    // Vérifier si déjà lu
    const existing = await this.prisma.announcement_read.findUnique({
      where: {
        announcement_id_user_id: {
          announcement_id: announcementId,
          user_id: userId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.announcement_read.create({
      data: {
        announcement_id: announcementId,
        user_id: userId,
      },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Annonce non trouvée');
    }

    return this.prisma.announcement.delete({
      where: { id },
    });
  }

  // Obtenir la liste des lecteurs d'une annonce
  async getReaders(announcementId: number) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw new NotFoundException('Annonce non trouvée');
    }

    // Récupérer les lectures
    const reads = await this.prisma.announcement_read.findMany({
      where: { announcement_id: announcementId },
      orderBy: { read_at: 'desc' },
    });

    // Récupérer les utilisateurs correspondants
    const userIds = reads.map((r) => r.user_id);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        full_name: true,
        work_email: true,
        profile_photo_url: true,
        department_id: true,
      },
    });

    // Récupérer les départements
    const deptIds = users.map((u) => u.department_id).filter(Boolean) as number[];
    const departments = await this.prisma.department.findMany({
      where: { id: { in: deptIds } },
      select: { id: true, department_name: true },
    });
    const deptMap = new Map(departments.map((d) => [d.id, d]));

    // Compter le nombre total de destinataires potentiels
    const targetCount = await this.prisma.user.count({
      where: {
        active: true,
        ...(announcement.target_all || !announcement.department_id
          ? {}
          : { department_id: announcement.department_id }),
      },
    });

    // Construire la réponse
    const userMap = new Map(users.map((u) => [u.id, u]));
    const readersData = reads.map((r) => {
      const user = userMap.get(r.user_id);
      return {
        user: user ? {
          ...user,
          department: user.department_id ? deptMap.get(user.department_id) : null,
        } : null,
        read_at: r.read_at,
      };
    }).filter((r) => r.user !== null);

    return {
      announcement_id: announcementId,
      total_readers: reads.length,
      total_target: targetCount,
      read_percentage: targetCount > 0 ? Math.round((reads.length / targetCount) * 100) : 0,
      readers: readersData,
    };
  }

  // Statistiques
  async getStats() {
    const [total, published, byType, byPriority] = await Promise.all([
      this.prisma.announcement.count(),
      this.prisma.announcement.count({ where: { is_published: true } }),
      this.prisma.announcement.groupBy({
        by: ['type'],
        _count: true,
      }),
      this.prisma.announcement.groupBy({
        by: ['priority'],
        _count: true,
      }),
    ]);

    return {
      total,
      published,
      draft: total - published,
      byType: byType.map(t => ({ type: t.type, count: t._count })),
      byPriority: byPriority.map(p => ({ priority: p.priority, count: p._count })),
    };
  }
}
