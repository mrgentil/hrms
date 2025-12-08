import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class TaskFeaturesService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  // ============================================
  // COMMENTAIRES
  // ============================================

  async getComments(taskId: number) {
    return this.prisma.task_comment.findMany({
      where: { task_id: taskId },
      include: {
        user: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async addComment(taskId: number, userId: number, content: string) {
    // Récupérer la tâche pour les notifications
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    const comment = await this.prisma.task_comment.create({
      data: {
        task_id: taskId,
        user_id: userId,
        content,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        user: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
      },
    });

    // Enregistrer l'activité
    await this.logActivity(taskId, userId, 'COMMENTED', null, null, content);

    // Détecter et notifier les mentions
    await this.processMentions(content, taskId, userId, task, comment.user.full_name);

    return comment;
  }

  // ============================================
  // GESTION DES MENTIONS (@utilisateur)
  // ============================================

  private async processMentions(
    content: string,
    taskId: number,
    authorId: number,
    task: any,
    authorName: string,
  ) {
    // Extraire les mentions (@Nom_Prenom)
    const mentionRegex = /@([\w_]+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]); // Nom sans le @
    }

    if (mentions.length === 0) return;

    // Pour chaque mention, trouver l'utilisateur et envoyer une notification
    for (const mention of mentions) {
      // Convertir les underscores en espaces pour chercher le nom complet
      const fullName = mention.replace(/_/g, ' ');
      
      // Chercher l'utilisateur par nom (MySQL est insensible à la casse par défaut)
      const mentionedUser = await this.prisma.user.findFirst({
        where: {
          full_name: fullName,
          id: { not: authorId }, // Ne pas notifier l'auteur
        },
      });

      if (mentionedUser) {
        // Créer une notification in-app
        await this.createMentionNotification(
          mentionedUser.id,
          authorId,
          authorName,
          taskId,
          task?.title || 'Tâche',
          task?.project?.name || 'Projet',
        );

        // Envoyer un email si l'utilisateur a un email
        if (mentionedUser.work_email) {
          await this.sendMentionEmail(
            mentionedUser.work_email,
            mentionedUser.full_name,
            authorName,
            task?.title || 'Tâche',
            task?.project?.name || 'Projet',
            content,
            taskId,
          );
        }
      }
    }
  }

  private async createMentionNotification(
    userId: number,
    authorId: number,
    authorName: string,
    taskId: number,
    taskTitle: string,
    projectName: string,
  ) {
    try {
      await this.prisma.notification.create({
        data: {
          user_id: userId,
          title: `${authorName} vous a mentionné`,
          message: `${authorName} vous a mentionné dans un commentaire sur la tâche "${taskTitle}" du projet "${projectName}"`,
          type: 'MENTION',
          entity_type: 'task',
          entity_id: taskId,
          link: `/projects?task=${taskId}`,
          is_read: false,
          created_at: new Date(),
        },
      });
    } catch (error) {
      console.error('Erreur création notification mention:', error);
    }
  }

  private async sendMentionEmail(
    email: string,
    recipientName: string,
    authorName: string,
    taskTitle: string,
    projectName: string,
    commentContent: string,
    taskId: number,
  ) {
    try {
      await this.mailService.sendMail({
        to: email,
        subject: `${authorName} vous a mentionné dans une tâche`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #465fff;">Vous avez été mentionné ! 🔔</h2>
            <p>Bonjour <strong>${recipientName}</strong>,</p>
            <p><strong>${authorName}</strong> vous a mentionné dans un commentaire sur la tâche :</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Projet :</strong> ${projectName}</p>
              <p style="margin: 0 0 10px 0;"><strong>Tâche :</strong> ${taskTitle}</p>
              <p style="margin: 0;"><strong>Commentaire :</strong></p>
              <p style="background-color: white; padding: 10px; border-radius: 4px; margin-top: 5px;">
                ${commentContent.replace(/@([\w_]+)/g, '<span style="color: #465fff; font-weight: bold;">@$1</span>')}
              </p>
            </div>
            <p>Connectez-vous pour répondre ou voir les détails de la tâche.</p>
            <p style="color: #888; font-size: 12px; margin-top: 30px;">
              — L'équipe HRMS
            </p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Erreur envoi email mention:', error);
    }
  }

  // ============================================
  // NOTIFICATION D'ASSIGNATION
  // ============================================

  private async notifyAssignment(
    userId: number,
    assignerName: string,
    taskId: number,
    taskTitle: string,
    projectName: string,
  ) {
    try {
      // Notification in-app
      await this.prisma.notification.create({
        data: {
          user_id: userId,
          title: `Nouvelle tâche assignée`,
          message: `${assignerName} vous a assigné à la tâche "${taskTitle}" dans le projet "${projectName}"`,
          type: 'TASK_ASSIGNED',
          entity_type: 'task',
          entity_id: taskId,
          link: `/projects?task=${taskId}`,
          is_read: false,
          created_at: new Date(),
        },
      });

      // Email
      const assignee = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { work_email: true, full_name: true },
      });

      if (assignee?.work_email) {
        await this.mailService.sendMail({
          to: assignee.work_email,
          subject: `Nouvelle tâche assignée : ${taskTitle}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #465fff;">Nouvelle tâche assignée 📋</h2>
              <p>Bonjour <strong>${assignee.full_name}</strong>,</p>
              <p><strong>${assignerName}</strong> vous a assigné à une nouvelle tâche :</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>Projet :</strong> ${projectName}</p>
                <p style="margin: 0;"><strong>Tâche :</strong> ${taskTitle}</p>
              </div>
              <p>Connectez-vous pour voir les détails et commencer à travailler dessus.</p>
              <p style="color: #888; font-size: 12px; margin-top: 30px;">
                — L'équipe HRMS
              </p>
            </div>
          `,
        });
      }
    } catch (error) {
      console.error('Erreur notification assignation:', error);
    }
  }

  async updateComment(commentId: number, userId: number, content: string) {
    const comment = await this.prisma.task_comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Commentaire non trouvé');
    }

    if (comment.user_id !== userId) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres commentaires');
    }

    return this.prisma.task_comment.update({
      where: { id: commentId },
      data: { content, updated_at: new Date() },
      include: {
        user: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
      },
    });
  }

  async deleteComment(commentId: number, userId: number) {
    const comment = await this.prisma.task_comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Commentaire non trouvé');
    }

    if (comment.user_id !== userId) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres commentaires');
    }

    await this.prisma.task_comment.delete({ where: { id: commentId } });
    return { success: true };
  }

  // ============================================
  // PIÈCES JOINTES
  // ============================================

  async getAttachments(taskId: number) {
    return this.prisma.task_attachment.findMany({
      where: { task_id: taskId },
      include: {
        user: {
          select: { id: true, full_name: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async addAttachment(taskId: number, userId: number, file: {
    fileName: string;
    filePath: string;
    fileSize?: number;
    fileType?: string;
  }) {
    const attachment = await this.prisma.task_attachment.create({
      data: {
        task_id: taskId,
        uploaded_by: userId,
        file_name: file.fileName,
        file_path: file.filePath,
        file_size: file.fileSize,
        file_type: file.fileType,
        created_at: new Date(),
      },
      include: {
        user: {
          select: { id: true, full_name: true },
        },
      },
    });

    await this.logActivity(taskId, userId, 'ATTACHMENT_ADDED', null, null, file.fileName);

    return attachment;
  }

  async deleteAttachment(attachmentId: number, userId: number) {
    const attachment = await this.prisma.task_attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new NotFoundException('Pièce jointe non trouvée');
    }

    await this.prisma.task_attachment.delete({ where: { id: attachmentId } });
    await this.logActivity(attachment.task_id, userId, 'ATTACHMENT_REMOVED', null, attachment.file_name, null);

    return { success: true, filePath: attachment.file_path };
  }

  // ============================================
  // CHECKLISTS
  // ============================================

  async getChecklists(taskId: number) {
    return this.prisma.task_checklist.findMany({
      where: { task_id: taskId },
      include: {
        items: {
          orderBy: { sort_order: 'asc' },
          include: {
            user: {
              select: { id: true, full_name: true },
            },
          },
        },
      },
      orderBy: { sort_order: 'asc' },
    });
  }

  async createChecklist(taskId: number, userId: number, title: string) {
    const checklist = await this.prisma.task_checklist.create({
      data: {
        task_id: taskId,
        title,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: { items: true },
    });

    await this.logActivity(taskId, userId, 'CHECKLIST_ADDED', null, null, title);

    return checklist;
  }

  async updateChecklist(checklistId: number, title: string) {
    return this.prisma.task_checklist.update({
      where: { id: checklistId },
      data: { title, updated_at: new Date() },
      include: { items: true },
    });
  }

  async deleteChecklist(checklistId: number, userId: number) {
    const checklist = await this.prisma.task_checklist.findUnique({
      where: { id: checklistId },
    });

    if (!checklist) {
      throw new NotFoundException('Checklist non trouvée');
    }

    await this.prisma.task_checklist.delete({ where: { id: checklistId } });
    await this.logActivity(checklist.task_id, userId, 'CHECKLIST_REMOVED', null, checklist.title, null);

    return { success: true };
  }

  async addChecklistItem(checklistId: number, userId: number, title: string) {
    const checklist = await this.prisma.task_checklist.findUnique({
      where: { id: checklistId },
    });

    if (!checklist) {
      throw new NotFoundException('Checklist non trouvée');
    }

    const item = await this.prisma.task_checklist_item.create({
      data: {
        checklist_id: checklistId,
        title,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return item;
  }

  async toggleChecklistItem(itemId: number, userId: number) {
    const item = await this.prisma.task_checklist_item.findUnique({
      where: { id: itemId },
      include: { checklist: true },
    });

    if (!item) {
      throw new NotFoundException('Élément non trouvé');
    }

    const newCompleted = !item.is_completed;

    const updated = await this.prisma.task_checklist_item.update({
      where: { id: itemId },
      data: {
        is_completed: newCompleted,
        completed_by: newCompleted ? userId : null,
        completed_at: newCompleted ? new Date() : null,
        updated_at: new Date(),
      },
      include: {
        user: {
          select: { id: true, full_name: true },
        },
      },
    });

    return updated;
  }

  async deleteChecklistItem(itemId: number) {
    await this.prisma.task_checklist_item.delete({ where: { id: itemId } });
    return { success: true };
  }

  // ============================================
  // SOUS-TÂCHES
  // ============================================

  async getSubtasks(taskId: number) {
    return this.prisma.task.findMany({
      where: { parent_task_id: taskId },
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
    });
  }

  async createSubtask(parentTaskId: number, userId: number, data: {
    title: string;
    description?: string;
    priority?: string;
    assignee_ids?: number[];
  }) {
    const parentTask = await this.prisma.task.findUnique({
      where: { id: parentTaskId },
      include: { project: true },
    });

    if (!parentTask) {
      throw new NotFoundException('Tâche parente non trouvée');
    }

    const subtask = await this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: (data.priority as any) || 'MEDIUM',
        status: 'TODO',
        parent_task_id: parentTaskId,
        project_id: parentTask.project_id,
        task_column_id: parentTask.task_column_id,
        created_by_user_id: userId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Assigner les membres et envoyer des notifications
    if (data.assignee_ids?.length) {
      await this.prisma.task_assignment.createMany({
        data: data.assignee_ids.map(assigneeId => ({
          task_id: subtask.id,
          user_id: assigneeId,
          assigned_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        })),
      });

      // Envoyer des notifications aux assignés
      const assigner = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { full_name: true },
      });

      for (const assigneeId of data.assignee_ids) {
        if (assigneeId !== userId) {
          await this.notifyAssignment(
            assigneeId,
            assigner?.full_name || 'Quelqu\'un',
            subtask.id,
            data.title,
            parentTask.project?.name || 'Projet',
          );
        }
      }
    }

    await this.logActivity(parentTaskId, userId, 'SUBTASK_ADDED', null, null, data.title);

    return this.prisma.task.findUnique({
      where: { id: subtask.id },
      include: {
        task_assignment: {
          include: {
            user: {
              select: { id: true, full_name: true, profile_photo_url: true },
            },
          },
        },
      },
    });
  }

  async updateSubtask(
    subtaskId: number,
    userId: number,
    data: {
      title?: string;
      description?: string;
      priority?: string;
      status?: string;
      assignee_ids?: number[];
    },
  ) {
    const subtask = await this.prisma.task.findUnique({
      where: { id: subtaskId },
      include: { 
        project: true,
        task_assignment: true,
      },
    });

    if (!subtask) {
      throw new NotFoundException('Sous-tâche non trouvée');
    }

    // Récupérer les anciens assignés
    const oldAssigneeIds = subtask.task_assignment.map(a => a.user_id);

    // Mettre à jour la sous-tâche
    await this.prisma.task.update({
      where: { id: subtaskId },
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority as any,
        status: data.status as any,
        updated_at: new Date(),
        updated_by_user_id: userId,
      },
    });

    // Mettre à jour les assignations si fourni
    if (data.assignee_ids !== undefined) {
      // Supprimer les anciennes assignations
      await this.prisma.task_assignment.deleteMany({
        where: { task_id: subtaskId },
      });

      // Créer les nouvelles assignations
      if (data.assignee_ids.length > 0) {
        await this.prisma.task_assignment.createMany({
          data: data.assignee_ids.map(assigneeId => ({
            task_id: subtaskId,
            user_id: assigneeId,
            assigned_at: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          })),
        });

        // Notifier les NOUVEAUX assignés uniquement
        const newAssigneeIds = data.assignee_ids.filter(id => !oldAssigneeIds.includes(id));
        
        if (newAssigneeIds.length > 0) {
          const assigner = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { full_name: true },
          });

          for (const assigneeId of newAssigneeIds) {
            if (assigneeId !== userId) {
              await this.notifyAssignment(
                assigneeId,
                assigner?.full_name || 'Quelqu\'un',
                subtaskId,
                data.title || subtask.title,
                subtask.project?.name || 'Projet',
              );
            }
          }
        }
      }
    }

    // Log activité sur la tâche parent
    if (subtask.parent_task_id) {
      await this.logActivity(subtask.parent_task_id, userId, 'SUBTASK_UPDATED', null, null, data.title || subtask.title);
    }

    return this.prisma.task.findUnique({
      where: { id: subtaskId },
      include: {
        task_assignment: {
          include: {
            user: {
              select: { id: true, full_name: true, profile_photo_url: true },
            },
          },
        },
      },
    });
  }

  async deleteSubtask(subtaskId: number, userId: number) {
    const subtask = await this.prisma.task.findUnique({
      where: { id: subtaskId },
    });

    if (!subtask) {
      throw new NotFoundException('Sous-tâche non trouvée');
    }

    // Supprimer les assignations
    await this.prisma.task_assignment.deleteMany({
      where: { task_id: subtaskId },
    });

    // Supprimer la sous-tâche
    await this.prisma.task.delete({
      where: { id: subtaskId },
    });

    // Log activité sur la tâche parent
    if (subtask.parent_task_id) {
      await this.logActivity(subtask.parent_task_id, userId, 'SUBTASK_DELETED', null, null, subtask.title);
    }
  }

  // ============================================
  // HISTORIQUE D'ACTIVITÉ
  // ============================================

  async getActivities(taskId: number) {
    return this.prisma.task_activity.findMany({
      where: { task_id: taskId },
      include: {
        user: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
  }

  async logActivity(
    taskId: number,
    userId: number,
    action: string,
    field?: string | null,
    oldValue?: string | null,
    newValue?: string | null,
  ) {
    return this.prisma.task_activity.create({
      data: {
        task_id: taskId,
        user_id: userId,
        action,
        field,
        old_value: oldValue,
        new_value: newValue,
        created_at: new Date(),
      },
    });
  }

  // ============================================
  // VUE LISTE
  // ============================================

  async getTasksList(projectId: number, filters?: {
    status?: string;
    priority?: string;
    assigneeId?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = { project_id: projectId };

    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }
    if (filters?.startDate || filters?.endDate) {
      where.due_date = {};
      if (filters.startDate) where.due_date.gte = new Date(filters.startDate);
      if (filters.endDate) where.due_date.lte = new Date(filters.endDate);
    }
    if (filters?.assigneeId) {
      where.task_assignment = {
        some: { user_id: filters.assigneeId },
      };
    }

    return this.prisma.task.findMany({
      where,
      include: {
        task_column: { select: { id: true, name: true } },
        task_assignment: {
          include: {
            user: {
              select: { id: true, full_name: true, profile_photo_url: true },
            },
          },
        },
        subtasks: {
          select: { id: true, status: true },
        },
        task_comments: {
          select: { id: true },
        },
        task_attachments: {
          select: { id: true },
        },
        task_checklists: {
          include: {
            items: {
              select: { id: true, is_completed: true },
            },
          },
        },
      },
      orderBy: [{ due_date: 'asc' }, { priority: 'desc' }, { created_at: 'desc' }],
    });
  }

  // ============================================
  // VUE CALENDRIER
  // ============================================

  async getTasksCalendar(projectId: number, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.prisma.task.findMany({
      where: {
        project_id: projectId,
        OR: [
          { due_date: { gte: startDate, lte: endDate } },
          { start_date: { gte: startDate, lte: endDate } },
        ],
      },
      include: {
        task_column: { select: { id: true, name: true } },
        task_assignment: {
          include: {
            user: {
              select: { id: true, full_name: true, profile_photo_url: true },
            },
          },
        },
      },
      orderBy: { due_date: 'asc' },
    });
  }

  async getTasksForDateRange(projectId: number, startDate: string, endDate: string) {
    return this.prisma.task.findMany({
      where: {
        project_id: projectId,
        OR: [
          { due_date: { gte: new Date(startDate), lte: new Date(endDate) } },
          { start_date: { gte: new Date(startDate), lte: new Date(endDate) } },
        ],
      },
      include: {
        task_column: { select: { id: true, name: true } },
        task_assignment: {
          include: {
            user: {
              select: { id: true, full_name: true, profile_photo_url: true },
            },
          },
        },
      },
      orderBy: { due_date: 'asc' },
    });
  }
}
