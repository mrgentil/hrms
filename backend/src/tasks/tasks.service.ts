import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  MoveTaskDto,
  CreateColumnDto,
  UpdateColumnDto,
  TaskStatus,
} from './dto/create-task.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: number, dto: CreateTaskDto) {
    // Vérifier que l'utilisateur a accès au projet
    await this.checkProjectAccess(dto.project_id, userId);

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: (dto.status as any) || 'TODO',
        priority: (dto.priority as any) || 'MEDIUM',
        start_date: dto.start_date ? new Date(dto.start_date) : null,
        due_date: dto.due_date ? new Date(dto.due_date) : null,
        project_id: dto.project_id,
        task_column_id: dto.task_column_id,
        created_by_user_id: userId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        user_task_created_by_user_idTouser: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
        task_column: true,
        project: {
          select: { id: true, name: true },
        },
      },
    });

    // Ajouter les assignés et envoyer des notifications
    if (dto.assignee_ids && dto.assignee_ids.length > 0) {
      const assigner = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { full_name: true },
      });

      for (const assigneeId of dto.assignee_ids) {
        await this.prisma.task_assignment.create({
          data: {
            task_id: task.id,
            user_id: assigneeId,
            assigned_at: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        // Notifier l'assigné (sauf si c'est le créateur)
        if (assigneeId !== userId) {
          await this.notificationsService.notifyTaskAssigned(
            assigneeId,
            task.id,
            task.title,
            task.project_id,
            assigner?.full_name || 'Quelqu\'un',
          );
        }
      }
    }

    return this.findOne(task.id, userId);
  }

  async findAll(projectId: number, userId: number) {
    await this.checkProjectAccess(projectId, userId);

    return this.prisma.task.findMany({
      where: { project_id: projectId },
      include: {
        user_task_created_by_user_idTouser: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
        task_assignment: {
          include: {
            user: {
              select: { id: true, full_name: true, profile_photo_url: true },
            },
          },
        },
        task_column: true,
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async findOne(id: number, userId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        user_task_created_by_user_idTouser: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
        task_assignment: {
          include: {
            user: {
              select: { id: true, full_name: true, profile_photo_url: true },
            },
          },
        },
        task_column: true,
        project: {
          select: { id: true, name: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    return task;
  }

  async update(id: number, userId: number, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { 
        project: true,
        task_assignment: { include: { user: { select: { id: true, full_name: true } } } },
      },
    });

    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    await this.checkProjectAccess(task.project_id, userId);

    // Vérifier si la tâche passe en DONE
    const isBeingCompleted = dto.status === TaskStatus.DONE && task.status !== 'DONE';

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status as any,
        priority: dto.priority as any,
        start_date: dto.start_date ? new Date(dto.start_date) : undefined,
        due_date: dto.due_date ? new Date(dto.due_date) : undefined,
        task_column_id: dto.task_column_id,
        completed_at: dto.status === TaskStatus.DONE ? new Date() : undefined,
        updated_by_user_id: userId,
        updated_at: new Date(),
      },
    });

    // Notifier tous les membres du projet quand une tâche est terminée
    if (isBeingCompleted) {
      await this.notifyTaskCompleted(task, userId);
    }

    // Mettre à jour les assignés si fournis
    if (dto.assignee_ids !== undefined) {
      // Récupérer les anciens assignés
      const oldAssignments = await this.prisma.task_assignment.findMany({
        where: { task_id: id },
        select: { user_id: true },
      });
      const oldAssigneeIds = oldAssignments.map(a => a.user_id);

      // Supprimer les anciens assignés
      await this.prisma.task_assignment.deleteMany({
        where: { task_id: id },
      });

      // Identifier les nouveaux assignés
      const newAssigneeIds = dto.assignee_ids.filter(id => !oldAssigneeIds.includes(id));

      // Ajouter les nouveaux et notifier
      const assigner = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { full_name: true },
      });

      for (const assigneeId of dto.assignee_ids) {
        await this.prisma.task_assignment.create({
          data: {
            task_id: id,
            user_id: assigneeId,
            assigned_at: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        // Notifier seulement les nouveaux assignés
        if (newAssigneeIds.includes(assigneeId) && assigneeId !== userId) {
          await this.notificationsService.notifyTaskAssigned(
            assigneeId,
            task.id,
            task.title,
            task.project_id,
            assigner?.full_name || 'Quelqu\'un',
          );
        }
      }
    }

    return this.findOne(id, userId);
  }

  async moveTask(id: number, userId: number, dto: MoveTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    await this.checkProjectAccess(task.project_id, userId);

    // Déterminer le nouveau statut basé sur la colonne
    const column = await this.prisma.task_column.findUnique({
      where: { id: dto.task_column_id },
    });

    let newStatus = task.status;
    if (column) {
      const columnName = column.name.toLowerCase();
      if (columnName.includes('faire') || columnName.includes('todo')) {
        newStatus = 'TODO' as any;
      } else if (columnName.includes('cours') || columnName.includes('progress')) {
        newStatus = 'IN_PROGRESS' as any;
      } else if (columnName.includes('revue') || columnName.includes('review')) {
        newStatus = 'BLOCKED' as any;
      } else if (columnName.includes('termin') || columnName.includes('done')) {
        newStatus = 'DONE' as any;
      }
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        task_column_id: dto.task_column_id,
        status: newStatus,
        completed_at: newStatus === 'DONE' ? new Date() : null,
        updated_at: new Date(),
      },
      include: {
        task_assignment: {
          include: {
            user: {
              select: { id: true, full_name: true, profile_photo_url: true },
            },
          },
        },
        task_column: true,
      },
    });
  }

  async remove(id: number, userId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    await this.checkProjectAccess(task.project_id, userId);

    await this.prisma.task.delete({ where: { id } });
    return { message: 'Tâche supprimée avec succès' };
  }

  // Gestion des colonnes
  async createColumn(userId: number, dto: CreateColumnDto) {
    const board = await this.prisma.task_board.findUnique({
      where: { id: dto.task_board_id },
      include: { project: true },
    });

    if (!board) {
      throw new NotFoundException('Tableau non trouvé');
    }

    await this.checkProjectAccess(board.project_id, userId);

    // Obtenir le prochain sort_order
    const lastColumn = await this.prisma.task_column.findFirst({
      where: { task_board_id: dto.task_board_id },
      orderBy: { sort_order: 'desc' },
    });

    const sortOrder = dto.sort_order ?? (lastColumn ? lastColumn.sort_order + 1 : 0);

    return this.prisma.task_column.create({
      data: {
        name: dto.name,
        sort_order: sortOrder,
        task_board_id: dto.task_board_id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  async updateColumn(id: number, userId: number, dto: UpdateColumnDto) {
    const column = await this.prisma.task_column.findUnique({
      where: { id },
      include: { task_board: { include: { project: true } } },
    });

    if (!column) {
      throw new NotFoundException('Colonne non trouvée');
    }

    await this.checkProjectAccess(column.task_board.project_id, userId);

    return this.prisma.task_column.update({
      where: { id },
      data: {
        name: dto.name,
        sort_order: dto.sort_order,
        updated_at: new Date(),
      },
    });
  }

  async deleteColumn(id: number, userId: number) {
    const column = await this.prisma.task_column.findUnique({
      where: { id },
      include: { task_board: { include: { project: true } }, task: true },
    });

    if (!column) {
      throw new NotFoundException('Colonne non trouvée');
    }

    await this.checkProjectAccess(column.task_board.project_id, userId);

    if (column.task.length > 0) {
      throw new ForbiddenException('Impossible de supprimer une colonne contenant des tâches');
    }

    await this.prisma.task_column.delete({ where: { id } });
    return { message: 'Colonne supprimée avec succès' };
  }

  async getBoard(projectId: number, userId: number) {
    await this.checkProjectAccess(projectId, userId);

    const board = await this.prisma.task_board.findFirst({
      where: { project_id: projectId },
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
                user_task_created_by_user_idTouser: {
                  select: { id: true, full_name: true },
                },
              },
              orderBy: { created_at: 'asc' },
            },
          },
        },
      },
    });

    return board;
  }

  private async checkProjectAccess(projectId: number, userId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { project_member: true },
    });

    if (!project) {
      throw new NotFoundException('Projet non trouvé');
    }

    const isOwner = project.owner_user_id === userId;
    const isMember = project.project_member.some(m => m.user_id === userId);

    if (!isOwner && !isMember) {
      throw new ForbiddenException('Accès non autorisé à ce projet');
    }
  }

  /**
   * Notifie tous les membres du projet quand une tâche est terminée
   */
  private async notifyTaskCompleted(task: any, completedByUserId: number) {
    try {
      // Récupérer l'utilisateur qui a terminé la tâche
      const completedBy = await this.prisma.user.findUnique({
        where: { id: completedByUserId },
        select: { full_name: true },
      });

      // Récupérer tous les membres du projet
      const project = await this.prisma.project.findUnique({
        where: { id: task.project_id },
        include: {
          project_member: {
            include: { user: { select: { id: true, full_name: true } } },
          },
        },
      });

      if (!project) return;

      // Liste des personnes à notifier (owner + membres, sauf celui qui a terminé)
      const usersToNotify = new Set<number>();
      
      if (project.owner_user_id && project.owner_user_id !== completedByUserId) {
        usersToNotify.add(project.owner_user_id);
      }
      
      for (const member of project.project_member) {
        if (member.user_id !== completedByUserId) {
          usersToNotify.add(member.user_id);
        }
      }

      // Créer les notifications
      const now = new Date();
      for (const userId of usersToNotify) {
        await this.prisma.notification.create({
          data: {
            user_id: userId,
            title: '✅ Tâche terminée',
            message: `${completedBy?.full_name || 'Un membre'} a terminé la tâche "${task.title}" dans le projet "${project.name}"`,
            type: 'TASK_COMPLETED',
            entity_type: 'task',
            entity_id: task.id,
            link: `/projects/${project.id}?task=${task.id}`,
            is_read: false,
            created_at: now,
          },
        });
      }

      // Enregistrer l'activité
      await this.prisma.task_activity.create({
        data: {
          task_id: task.id,
          user_id: completedByUserId,
          action: 'COMPLETED',
          field: 'status',
          old_value: task.status,
          new_value: 'DONE',
          created_at: now,
        },
      });

    } catch (error) {
      console.error('Erreur notification tâche terminée:', error);
    }
  }
}
