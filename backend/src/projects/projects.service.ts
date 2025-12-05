import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto, AddProjectMemberDto, ProjectStatus } from './dto/create-project.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: number, dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        status: (dto.status as any) || 'PLANNED',
        start_date: dto.start_date ? new Date(dto.start_date) : null,
        end_date: dto.end_date ? new Date(dto.end_date) : null,
        owner_user_id: userId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        user: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
      },
    });

    // Ajouter le créateur comme membre du projet
    await this.prisma.project_member.create({
      data: {
        project_id: project.id,
        user_id: userId,
        role: 'Owner',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Créer un tableau par défaut avec des colonnes
    const board = await this.prisma.task_board.create({
      data: {
        name: 'Tableau principal',
        project_id: project.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Créer les colonnes par défaut
    const defaultColumns = ['À faire', 'En cours', 'En revue', 'Terminé'];
    for (let i = 0; i < defaultColumns.length; i++) {
      await this.prisma.task_column.create({
        data: {
          name: defaultColumns[i],
          sort_order: i,
          task_board_id: board.id,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }

    return project;
  }

  async findAll(userId: number) {
    // Récupérer les projets où l'utilisateur est membre ou propriétaire
    const projects = await this.prisma.project.findMany({
      where: {
        OR: [
          { owner_user_id: userId },
          { project_member: { some: { user_id: userId } } },
        ],
      },
      include: {
        user: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
        project_member: {
          include: {
            user: {
              select: { id: true, full_name: true, profile_photo_url: true },
            },
          },
        },
        _count: {
          select: { task: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return projects.map(project => ({
      ...project,
      taskCount: project._count.task,
      memberCount: project.project_member.length,
    }));
  }

  async findOne(id: number, userId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
        project_member: {
          include: {
            user: {
              select: { id: true, full_name: true, profile_photo_url: true, work_email: true },
            },
          },
        },
        task_board: {
          include: {
            task_column: {
              orderBy: { sort_order: 'asc' },
              include: {
                task: {
                  include: {
                    task_assignment: {
                      include: {
                        user: {
                          select: { id: true, full_name: true, profile_photo_url: true },
                        },
                      },
                    },
                  },
                  orderBy: { created_at: 'asc' },
                },
              },
            },
          },
        },
        _count: {
          select: { task: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Projet non trouvé');
    }

    // Vérifier l'accès
    const isMember = project.project_member.some(m => m.user_id === userId);
    const isOwner = project.owner_user_id === userId;
    
    if (!isMember && !isOwner) {
      throw new ForbiddenException('Accès non autorisé à ce projet');
    }

    return project;
  }

  async update(id: number, userId: number, dto: UpdateProjectDto) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { project_member: true },
    });

    if (!project) {
      throw new NotFoundException('Projet non trouvé');
    }

    // Vérifier les droits (propriétaire ou membre)
    const isOwner = project.owner_user_id === userId;
    const isMember = project.project_member.some(m => m.user_id === userId);

    if (!isOwner && !isMember) {
      throw new ForbiddenException('Accès non autorisé');
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status as any,
        start_date: dto.start_date ? new Date(dto.start_date) : undefined,
        end_date: dto.end_date ? new Date(dto.end_date) : undefined,
        updated_at: new Date(),
      },
      include: {
        user: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
      },
    });
  }

  async remove(id: number, userId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('Projet non trouvé');
    }

    if (project.owner_user_id !== userId) {
      throw new ForbiddenException('Seul le propriétaire peut supprimer le projet');
    }

    await this.prisma.project.delete({ where: { id } });
    return { message: 'Projet supprimé avec succès' };
  }

  async addMember(projectId: number, userId: number, dto: AddProjectMemberDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { 
        project_member: true,
        user: { select: { full_name: true } },
      },
    });

    if (!project) {
      throw new NotFoundException('Projet non trouvé');
    }

    // Vérifier si déjà membre
    const existingMember = project.project_member.find(m => m.user_id === dto.user_id);
    if (existingMember) {
      throw new ForbiddenException('Cet utilisateur est déjà membre du projet');
    }

    const member = await this.prisma.project_member.create({
      data: {
        project_id: projectId,
        user_id: dto.user_id,
        role: dto.role || 'Member',
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        user: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
      },
    });

    // Envoyer une notification au nouveau membre
    if (dto.user_id !== userId) {
      const addedBy = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { full_name: true },
      });
      
      await this.notificationsService.notifyProjectAdded(
        dto.user_id,
        projectId,
        project.name,
        addedBy?.full_name || 'Quelqu\'un',
      );
    }

    return member;
  }

  async removeMember(projectId: number, memberId: number, userId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Projet non trouvé');
    }

    if (project.owner_user_id !== userId) {
      throw new ForbiddenException('Seul le propriétaire peut retirer des membres');
    }

    // Récupérer le membre avant suppression pour la notification
    const member = await this.prisma.project_member.findUnique({
      where: { id: memberId },
      include: { user: { select: { id: true } } },
    });

    await this.prisma.project_member.delete({
      where: { id: memberId },
    });

    // Envoyer une notification au membre retiré
    if (member && member.user_id !== userId) {
      const removedBy = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { full_name: true },
      });
      
      await this.notificationsService.notifyProjectRemoved(
        member.user_id,
        project.name,
        removedBy?.full_name || 'Quelqu\'un',
      );
    }

    return { message: 'Membre retiré avec succès' };
  }

  async getProjectStats(projectId: number) {
    const tasks = await this.prisma.task.findMany({
      where: { project_id: projectId },
    });

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'DONE' || t.status === 'ARCHIVED').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const blocked = tasks.filter(t => t.status === 'BLOCKED').length;
    const todo = tasks.filter(t => t.status === 'TODO').length;

    return {
      total,
      completed,
      inProgress,
      blocked,
      todo,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }
}
