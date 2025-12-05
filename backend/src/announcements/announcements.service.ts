import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AnnouncementsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(createAnnouncementDto: CreateAnnouncementDto, authorId: number) {
    const announcement = await this.prisma.announcement.create({
      data: {
        ...createAnnouncementDto,
        author_id: authorId,
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
    });

    if (!existing) {
      throw new NotFoundException('Annonce non trouvée');
    }

    return this.prisma.announcement.update({
      where: { id },
      data: {
        is_published: true,
        publish_date: new Date(),
      },
    });
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
