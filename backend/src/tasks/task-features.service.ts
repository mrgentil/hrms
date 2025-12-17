import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { generateCommentNotificationEmail } from '../mail/email-templates.helper';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TaskFeaturesService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private configService: ConfigService,
  ) { }

  // Récupérer le nom de l'app depuis les settings ou la config
  private async getAppSettings() {
    const settings = await this.prisma.app_settings.findMany({
      where: { key: { in: ['app_name', 'primary_color', 'logo_light'] } },
    });

    const appName = settings.find(s => s.key === 'app_name')?.value ||
      this.configService.get('APP_NAME') || 'HRMS';
    const primaryColor = settings.find(s => s.key === 'primary_color')?.value || '#465fff';
    const logoUrl = settings.find(s => s.key === 'logo_light')?.value || undefined;
    const appUrl = this.configService.get('APP_URL') || 'http://localhost:3000';

    return { appName, primaryColor, logoUrl, appUrl };
  }

  // ============================================
  // COMMENTAIRES
  // ============================================

  async getComments(taskId: number) {
    const comments = await this.prisma.task_comment.findMany({
      where: { task_id: taskId },
      include: {
        user: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
        parent_comment: {
          include: {
            user: {
              select: { id: true, full_name: true },
            },
          },
        },
        attachments: {
          select: {
            id: true,
            file_name: true,
            file_path: true,
            file_size: true,
            file_type: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    // DEBUG: Log des commentaires avec leurs pièces jointes
    console.log('📝 getComments - taskId:', taskId);
    comments.forEach(c => {
      console.log(`  Comment ${c.id}: ${c.attachments?.length || 0} attachments`);
    });

    return comments;
  }

  async addComment(
    taskId: number,
    userId: number,
    content: string,
    parentCommentId?: number,
    attachmentPaths: string[] = [],
  ) {
    // Récupérer la tâche pour les notifications
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
        task_assignment: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    // Récupérer le commentaire parent si c'est une réponse
    let parentComment: any = null;
    if (parentCommentId) {
      parentComment = await this.prisma.task_comment.findUnique({
        where: { id: parentCommentId },
        include: { user: true },
      });
    }

    const comment = await this.prisma.task_comment.create({
      data: {
        task_id: taskId,
        user_id: userId,
        content,
        parent_comment_id: parentCommentId || null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        user: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
        parent_comment: {
          include: {
            user: {
              select: { id: true, full_name: true },
            },
          },
        },
      },
    });

    // Lier les pièces jointes au commentaire et récupérer leurs infos
    const attachmentInfos: { filename: string; path: string; contentType?: string }[] = [];
    console.log('📎 addComment - attachmentPaths reçus:', attachmentPaths);

    if (attachmentPaths.length > 0) {
      // Mettre à jour les attachments pour les lier au commentaire
      const updateResult = await this.prisma.task_attachment.updateMany({
        where: { file_path: { in: attachmentPaths } },
        data: { comment_id: comment.id },
      });
      console.log('📎 Mise à jour attachments - count:', updateResult.count);

      // Récupérer les infos des attachments pour l'email
      const attachments = await this.prisma.task_attachment.findMany({
        where: { comment_id: comment.id },
        select: { id: true, file_name: true, file_path: true, file_type: true },
      });
      console.log('📎 Attachments liés au commentaire:', attachments);

      for (const att of attachments) {
        attachmentInfos.push({
          filename: att.file_name,
          path: att.file_path,
          contentType: att.file_type || undefined,
        });
      }
    }

    // Enregistrer l'activité
    await this.logActivity(taskId, userId, 'COMMENTED', null, null, content);

    // Détecter et notifier les mentions
    await this.processMentions(content, taskId, userId, task, comment.user.full_name);

    // Notifier créateur + assignés + auteur du commentaire parent
    // Passer les fichiers pour les joindre à l'email
    await this.notifyCommentSubscribers(
      task,
      userId,
      comment.user.full_name || 'Quelqu\'un',
      content,
      parentComment,
      attachmentInfos.map(a => a.filename),
      attachmentInfos,
    );

    // Retourner le commentaire avec ses pièces jointes
    return this.prisma.task_comment.findUnique({
      where: { id: comment.id },
      include: {
        user: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
        parent_comment: {
          include: {
            user: {
              select: { id: true, full_name: true },
            },
          },
        },
        attachments: {
          select: {
            id: true,
            file_name: true,
            file_path: true,
            file_size: true,
            file_type: true,
          },
        },
      },
    });
  }

  // Ajouter un commentaire avec pièce jointe
  async addCommentWithAttachment(
    taskId: number,
    userId: number,
    content: string,
    parentCommentId?: number,
    file?: Express.Multer.File,
  ) {
    // Récupérer la tâche pour les notifications
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
        task_assignment: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    // Récupérer le commentaire parent si c'est une réponse
    let parentComment: any = null;
    if (parentCommentId) {
      parentComment = await this.prisma.task_comment.findUnique({
        where: { id: parentCommentId },
        include: { user: true },
      });
    }

    // Créer le commentaire
    const comment = await this.prisma.task_comment.create({
      data: {
        task_id: taskId,
        user_id: userId,
        content,
        parent_comment_id: parentCommentId || null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        user: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
        parent_comment: {
          include: {
            user: {
              select: { id: true, full_name: true },
            },
          },
        },
      },
    });

    // Si un fichier est joint, l'ajouter comme pièce jointe
    let attachment: any = null;
    if (file) {
      // Note: comment_id sera ajouté après la migration
      attachment = await this.prisma.task_attachment.create({
        data: {
          task_id: taskId,
          // comment_id: comment.id, // Sera ajouté après migration
          uploaded_by: userId,
          file_name: file.originalname,
          file_path: file.path,
          file_size: file.size,
          file_type: file.mimetype,
          created_at: new Date(),
        },
      });
    }

    // Enregistrer l'activité
    await this.logActivity(taskId, userId, 'COMMENTED', null, null, content);

    // Détecter et notifier les mentions
    await this.processMentions(content, taskId, userId, task, comment.user.full_name);

    // Notifier créateur + assignés + auteur du commentaire parent
    const attachmentInfos = file ? [{
      filename: file.originalname,
      path: file.path,
      contentType: file.mimetype,
    }] : [];

    await this.notifyCommentSubscribers(
      task,
      userId,
      comment.user.full_name || 'Quelqu\'un',
      content,
      parentComment,
      attachment ? [file!.originalname] : [],
      attachmentInfos,
    );

    return comment;
  }

  // Notifier les personnes concernées par un commentaire
  private async notifyCommentSubscribers(
    task: any,
    authorId: number,
    authorName: string,
    commentContent: string,
    parentComment: any,
    attachmentNames: string[] = [],
    attachmentInfos: { filename: string; path: string; contentType?: string }[] = [],
  ) {
    const usersToNotify = new Set<number>();

    // Ajouter le créateur de la tâche
    if (task.created_by_user_id && task.created_by_user_id !== authorId) {
      usersToNotify.add(task.created_by_user_id);
    }

    // Ajouter tous les assignés de la tâche
    for (const assignment of task.task_assignment || []) {
      if (assignment.user_id !== authorId) {
        usersToNotify.add(assignment.user_id);
      }
    }

    // Si c'est une réponse, ajouter l'auteur du commentaire parent
    if (parentComment && parentComment.user_id !== authorId) {
      usersToNotify.add(parentComment.user_id);
    }

    // Ajouter le chef de projet et les membres du projet avec rôle de gestion
    if (task.project_id) {
      const projectMembers = await this.prisma.project_member.findMany({
        where: {
          project_id: task.project_id,
          user_id: { not: authorId },
          role: { in: ['OWNER', 'ADMIN', 'MANAGER'] },
        },
      });
      for (const member of projectMembers) {
        usersToNotify.add(member.user_id);
      }
    }

    // Récupérer les paramètres de l'app
    const appSettings = await this.getAppSettings();

    // Si aucun attachmentNames n'est fourni, extraire du contenu
    const finalAttachmentNames = attachmentNames.length > 0
      ? attachmentNames
      : (() => {
        const names: string[] = [];
        const lines = commentContent.split('\n');
        for (const line of lines) {
          if (line.startsWith('📎')) {
            names.push(line.replace('📎 ', '').trim());
          }
        }
        return names;
      })();

    // Créer les notifications
    const isReply = !!parentComment;
    const title = isReply
      ? `${authorName} a répondu à un commentaire`
      : `Nouveau commentaire sur une tâche`;

    const message = isReply
      ? `${authorName} a répondu à ${parentComment.user?.full_name || 'un commentaire'} sur la tâche "${task.title}"`
      : `${authorName} a commenté la tâche "${task.title}" dans le projet "${task.project?.name || 'Projet'}"`;

    for (const userId of usersToNotify) {
      try {
        await this.prisma.notification.create({
          data: {
            user_id: userId,
            title,
            message,
            type: 'TASK_COMMENT',
            entity_type: 'task',
            entity_id: task.id,
            link: `/projects?task=${task.id}`,
            is_read: false,
            created_at: new Date(),
          },
        });
      } catch (error) {
        console.error('Erreur création notification commentaire:', error);
      }
    }

    // Envoyer des emails aux utilisateurs avec le nouveau template
    for (const userId of usersToNotify) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { work_email: true, full_name: true },
        });

        if (user?.work_email) {
          const emailHtml = generateCommentNotificationEmail({
            appName: appSettings.appName,
            appUrl: appSettings.appUrl,
            primaryColor: appSettings.primaryColor,
            logoUrl: appSettings.logoUrl,
            recipientName: user.full_name || 'Utilisateur',
            authorName,
            taskTitle: task.title,
            projectName: task.project?.name || '',
            commentContent,
            isReply,
            replyToName: parentComment?.user?.full_name,
            attachmentNames: finalAttachmentNames,
            taskUrl: `${appSettings.appUrl}/projects/${task.project_id}?task=${task.id}`,
          });

          // Préparer les pièces jointes pour l'email (avec les vrais fichiers)
          // Convertir le chemin relatif en chemin absolu
          const fs = require('fs');
          const path = require('path');

          const emailAttachments = attachmentInfos.map(info => {
            // Le chemin en BD peut être: ./uploads/tasks/file.png ou uploads/tasks/file.png
            let cleanPath = info.path.replace(/\\/g, '/');
            if (cleanPath.startsWith('./')) {
              cleanPath = cleanPath.substring(2);
            }

            const absolutePath = path.join(process.cwd(), cleanPath);
            const fileExists = fs.existsSync(absolutePath);

            console.log('📧 Email attachment:');
            console.log('   - Chemin BD:', info.path);
            console.log('   - Chemin absolu:', absolutePath);
            console.log('   - Fichier existe:', fileExists);

            return {
              filename: info.filename,
              path: absolutePath,
              contentType: info.contentType,
            };
          });

          await this.mailService.sendMail({
            to: user.work_email,
            subject: `[${appSettings.appName}] ${title}`,
            html: emailHtml,
            attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
          });
        }
      } catch (error) {
        console.error('Erreur envoi email commentaire:', error);
      }
    }
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

  // ============================================
  // PROGRESSION PAR MEMBRE
  // ============================================

  async getMembersProgress(projectId: number) {
    // Récupérer le projet avec ses membres
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        user: { select: { id: true, full_name: true, profile_photo_url: true } },
        project_member: {
          include: {
            user: { select: { id: true, full_name: true, profile_photo_url: true } },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Projet non trouvé');
    }

    // Collecter tous les membres (owner + membres)
    const allMembers: { id: number; full_name: string; profile_photo_url: string | null; role: string }[] = [];

    if (project.user) {
      allMembers.push({
        ...project.user,
        role: 'owner',
      });
    }

    for (const pm of project.project_member) {
      if (pm.user && !allMembers.find(m => m.id === pm.user.id)) {
        allMembers.push({
          ...pm.user,
          role: pm.role || 'member',
        });
      }
    }

    // Récupérer toutes les tâches du projet
    const tasks = await this.prisma.task.findMany({
      where: { project_id: projectId },
      include: {
        task_assignment: true,
      },
    });

    // Calculer les statistiques par membre
    const membersProgress = await Promise.all(
      allMembers.map(async (member) => {
        // Tâches assignées à ce membre
        const assignedTaskIds = tasks
          .filter(t => t.task_assignment.some(a => a.user_id === member.id))
          .map(t => t.id);

        const assignedTasks = tasks.filter(t => assignedTaskIds.includes(t.id));
        const total = assignedTasks.length;
        const done = assignedTasks.filter(t => t.status === 'DONE').length;
        const inProgress = assignedTasks.filter(t => t.status === 'IN_PROGRESS').length;
        const todo = assignedTasks.filter(t => t.status === 'TODO').length;
        const overdue = assignedTasks.filter(t =>
          t.due_date && new Date(t.due_date) < new Date() && t.status !== 'DONE'
        ).length;

        // Dernière tâche terminée
        const lastCompleted = await this.prisma.task.findFirst({
          where: {
            id: { in: assignedTaskIds.length > 0 ? assignedTaskIds : [-1] },
            status: 'DONE',
          },
          orderBy: { completed_at: 'desc' },
          select: { id: true, title: true, completed_at: true },
        });

        return {
          user: {
            id: member.id,
            full_name: member.full_name,
            profile_photo_url: member.profile_photo_url,
            role: member.role,
          },
          stats: {
            total,
            done,
            inProgress,
            todo,
            overdue,
            completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
          },
          lastCompletedTask: lastCompleted,
        };
      })
    );

    // Trier par nombre de tâches terminées (décroissant)
    membersProgress.sort((a, b) => b.stats.done - a.stats.done);

    return {
      projectId,
      projectName: project.name,
      totalTasks: tasks.length,
      members: membersProgress,
    };
  }

  async getProjectActivityLog(projectId: number, limit: number = 50) {
    // Récupérer les activités récentes du projet
    const activities = await this.prisma.task_activity.findMany({
      where: {
        task: { project_id: projectId },
      },
      include: {
        user: { select: { id: true, full_name: true, profile_photo_url: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    // Formater les activités
    return activities.map(activity => ({
      id: activity.id,
      action: activity.action,
      field: activity.field,
      oldValue: activity.old_value,
      newValue: activity.new_value,
      user: activity.user,
      task: activity.task,
      createdAt: activity.created_at,
      message: this.formatActivityMessage(activity),
    }));
  }

  private formatActivityMessage(activity: any): string {
    const userName = activity.user?.full_name || 'Quelqu\'un';
    const taskTitle = activity.task?.title || 'une tâche';

    switch (activity.action) {
      case 'COMPLETED':
        return `${userName} a terminé "${taskTitle}"`;
      case 'CREATED':
        return `${userName} a créé "${taskTitle}"`;
      case 'UPDATED':
        if (activity.field === 'status') {
          return `${userName} a changé le statut de "${taskTitle}"`;
        }
        return `${userName} a modifié "${taskTitle}"`;
      case 'MOVED':
        return `${userName} a déplacé "${taskTitle}"`;
      case 'COMMENTED':
        return `${userName} a commenté sur "${taskTitle}"`;
      case 'ASSIGNED':
        return `${userName} a été assigné à "${taskTitle}"`;
      default:
        return `${userName} a effectué une action sur "${taskTitle}"`;
    }
  }

  // ============================================
  // MES TÂCHES
  // ============================================

  async getUserTasks(userId: number, filters: { status?: string; priority?: string }) {
    const where: any = {
      task_assignment: {
        some: { user_id: userId },
      },
    };

    if (filters.status && filters.status !== 'all') {
      where.status = filters.status;
    }

    if (filters.priority && filters.priority !== 'all') {
      where.priority = filters.priority;
    }

    return this.prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        task_column: { select: { id: true, name: true } },
        task_assignment: {
          include: {
            user: { select: { id: true, full_name: true, profile_photo_url: true } },
          },
        },
        user_task_created_by_user_idTouser: {
          select: { id: true, full_name: true },
        },
      },
      orderBy: [
        { due_date: 'asc' },
        { priority: 'desc' },
        { created_at: 'desc' },
      ],
    });
  }

  async getUserTasksStats(userId: number) {
    const tasks = await this.prisma.task.findMany({
      where: {
        task_assignment: {
          some: { user_id: userId },
        },
      },
      select: {
        id: true,
        status: true,
        priority: true,
        due_date: true,
      },
    });

    const now = new Date();
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'DONE').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const todo = tasks.filter(t => t.status === 'TODO').length;
    const blocked = tasks.filter(t => t.status === 'BLOCKED').length;
    const overdue = tasks.filter(t =>
      t.due_date && new Date(t.due_date) < now && t.status !== 'DONE'
    ).length;
    const dueSoon = tasks.filter(t => {
      if (!t.due_date || t.status === 'DONE') return false;
      const dueDate = new Date(t.due_date);
      const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 3;
    }).length;

    return {
      total,
      done,
      inProgress,
      todo,
      blocked,
      overdue,
      dueSoon,
      completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  }

  async updateUserTaskStatus(userId: number, taskId: number, status: string) {
    // Vérifier que l'utilisateur est bien assigné à cette tâche
    const assignment = await this.prisma.task_assignment.findFirst({
      where: {
        task_id: taskId,
        user_id: userId,
      },
    });

    if (!assignment) {
      throw new ForbiddenException('Vous n\'êtes pas assigné à cette tâche');
    }

    // Récupérer la tâche actuelle pour obtenir le project_id
    const currentTask = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            task_board: {
              include: {
                task_column: true,
              },
            },
          },
        },
      },
    });

    if (!currentTask) {
      throw new NotFoundException('Tâche non trouvée');
    }

    // Trouver la colonne correspondant au nouveau statut
    // Mapping des statuts vers les noms de colonnes typiques (ordre de priorité)
    const statusToColumnName: Record<string, string[][]> = {
      'TODO': [['À faire', 'A faire', 'Todo', 'Backlog', 'To do']],
      'IN_PROGRESS': [['En cours', 'In Progress', 'Doing', 'Working']],
      'BLOCKED': [['Bloqué', 'Bloquée', 'Blocked', 'En attente'], ['En revue', 'Review', 'Waiting']],
      'DONE': [['Terminé', 'Terminée', 'Done', 'Fait', 'Completed', 'Fini']],
      'ARCHIVED': [['Archivé', 'Archivée', 'Archived'], ['Terminé', 'Terminée', 'Done', 'Fait']], // Fallback vers Terminé
    };

    let newColumnId = currentTask.task_column_id;

    // Chercher une colonne correspondante dans le board du projet
    if (currentTask.project?.task_board?.length > 0) {
      const board = currentTask.project.task_board[0];
      const priorityGroups = statusToColumnName[status] || [];

      // Parcourir les groupes de priorité (premier groupe = priorité haute)
      outerLoop:
      for (const possibleNames of priorityGroups) {
        for (const column of board.task_column) {
          const columnNameLower = column.name.toLowerCase();
          if (possibleNames.some(name => columnNameLower.includes(name.toLowerCase()))) {
            newColumnId = column.id;
            break outerLoop;
          }
        }
      }
    }

    // Mettre à jour le statut ET la colonne
    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: status as any,
        task_column_id: newColumnId,
        completed_at: status === 'DONE' ? new Date() : null,
        updated_at: new Date(),
        updated_by_user_id: userId,
      },
      include: {
        project: { select: { id: true, name: true } },
        task_column: { select: { id: true, name: true } },
      },
    });

    // Enregistrer l'activité
    await this.prisma.task_activity.create({
      data: {
        task_id: taskId,
        user_id: userId,
        action: status === 'DONE' ? 'COMPLETED' : 'UPDATED',
        field: 'status',
        new_value: status,
        created_at: new Date(),
      },
    });

    // Notifier les autres membres si la tâche est terminée
    if (status === 'DONE') {
      await this.notifyTaskCompleted(currentTask, userId);
    }

    return updatedTask;
  }

  /**
   * Notifie les membres du projet qu'une tâche est terminée
   */
  private async notifyTaskCompleted(task: any, completedByUserId: number) {
    try {
      const completedBy = await this.prisma.user.findUnique({
        where: { id: completedByUserId },
        select: { full_name: true },
      });

      const project = await this.prisma.project.findUnique({
        where: { id: task.project_id },
        include: {
          project_member: { select: { user_id: true } },
        },
      });

      if (!project) return;

      const usersToNotify = new Set<number>();
      if (project.owner_user_id && project.owner_user_id !== completedByUserId) {
        usersToNotify.add(project.owner_user_id);
      }
      for (const member of project.project_member) {
        if (member.user_id !== completedByUserId) {
          usersToNotify.add(member.user_id);
        }
      }

      const now = new Date();
      for (const userId of usersToNotify) {
        await this.prisma.notification.create({
          data: {
            user_id: userId,
            title: '✅ Tâche terminée',
            message: `${completedBy?.full_name || 'Un membre'} a terminé "${task.title}"`,
            type: 'TASK_COMPLETED',
            entity_type: 'task',
            entity_id: task.id,
            link: `/projects/${project.id}`,
            is_read: false,
            created_at: now,
          },
        });
      }
    } catch (error) {
      console.error('Erreur notification:', error);
    }
  }

  // ============================================
  // SUIVI DU TEMPS
  // ============================================

  async getTimeEntries(taskId: number) {
    return this.prisma.task_time_entry.findMany({
      where: { task_id: taskId },
      include: {
        user: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async addTimeEntry(taskId: number, userId: number, data: {
    hours: number;
    date: string;
    description?: string;
    startedAt?: string;
    endedAt?: string;
    isBillable?: boolean;
  }) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Tâche non trouvée');

    const now = new Date();
    return this.prisma.task_time_entry.create({
      data: {
        task_id: taskId,
        user_id: userId,
        hours: data.hours,
        date: new Date(data.date),
        description: data.description,
        started_at: data.startedAt ? new Date(data.startedAt) : null,
        ended_at: data.endedAt ? new Date(data.endedAt) : null,
        is_billable: data.isBillable || false,
        created_at: now,
        updated_at: now,
      },
      include: {
        user: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
      },
    });
  }

  async updateTimeEntry(entryId: number, userId: number, data: {
    hours?: number;
    date?: string;
    description?: string;
    isBillable?: boolean;
  }) {
    const entry = await this.prisma.task_time_entry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('Entrée non trouvée');
    if (entry.user_id !== userId) throw new ForbiddenException('Non autorisé');

    return this.prisma.task_time_entry.update({
      where: { id: entryId },
      data: {
        hours: data.hours,
        date: data.date ? new Date(data.date) : undefined,
        description: data.description,
        is_billable: data.isBillable,
        updated_at: new Date(),
      },
    });
  }

  async deleteTimeEntry(entryId: number, userId: number) {
    const entry = await this.prisma.task_time_entry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('Entrée non trouvée');
    if (entry.user_id !== userId) throw new ForbiddenException('Non autorisé');

    return this.prisma.task_time_entry.delete({ where: { id: entryId } });
  }

  async getTaskTimeStats(taskId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { estimated_hours: true },
    });

    const entries = await this.prisma.task_time_entry.findMany({
      where: { task_id: taskId },
      select: { hours: true },
    });

    const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);

    return {
      estimated_hours: task?.estimated_hours ? Number(task.estimated_hours) : null,
      total_hours: totalHours,
      remaining_hours: task?.estimated_hours
        ? Math.max(0, Number(task.estimated_hours) - totalHours)
        : null,
      entries_count: entries.length,
    };
  }

  // ============================================
  // DÉPENDANCES
  // ============================================

  async getTaskDependencies(taskId: number) {
    const dependencies = await this.prisma.task_dependency.findMany({
      where: { task_id: taskId },
      include: {
        depends_on: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
    });

    const dependedBy = await this.prisma.task_dependency.findMany({
      where: { depends_on_id: taskId },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
    });

    return { dependencies, depended_by: dependedBy };
  }

  async addTaskDependency(taskId: number, dependsOnTaskId: number, userId: number, dependencyType: string = 'FINISH_TO_START') {
    // Vérifier que les tâches existent
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    const dependsOnTask = await this.prisma.task.findUnique({ where: { id: dependsOnTaskId } });

    if (!task || !dependsOnTask) throw new NotFoundException('Tâche non trouvée');
    if (taskId === dependsOnTaskId) throw new ForbiddenException('Une tâche ne peut pas dépendre d\'elle-même');

    // Vérifier qu'il n'y a pas de dépendance circulaire
    const existingReverse = await this.prisma.task_dependency.findFirst({
      where: { task_id: dependsOnTaskId, depends_on_id: taskId },
    });
    if (existingReverse) throw new ForbiddenException('Dépendance circulaire détectée');

    const now = new Date();
    return this.prisma.task_dependency.create({
      data: {
        task_id: taskId,
        depends_on_id: dependsOnTaskId,
        dependency_type: dependencyType,
        created_by: userId,
        created_at: now,
      },
      include: {
        depends_on: {
          select: { id: true, title: true, status: true },
        },
      },
    });
  }

  async removeTaskDependency(taskId: number, dependsOnTaskId: number) {
    return this.prisma.task_dependency.deleteMany({
      where: { task_id: taskId, depends_on_id: dependsOnTaskId },
    });
  }

  // ============================================
  // TEMPLATES
  // ============================================

  async getTemplates(projectId?: number) {
    return this.prisma.task_template.findMany({
      where: {
        OR: [
          { is_global: true },
          { project_id: projectId },
        ],
      },
      include: {
        creator: { select: { id: true, full_name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createTemplate(userId: number, data: {
    name: string;
    description?: string;
    priority?: string;
    estimatedHours?: number;
    checklistJson?: string;
    subtasksJson?: string;
    isGlobal?: boolean;
    projectId?: number;
  }) {
    const now = new Date();
    return this.prisma.task_template.create({
      data: {
        name: data.name,
        description: data.description,
        priority: (data.priority as any) || 'MEDIUM',
        estimated_hours: data.estimatedHours,
        checklist_json: data.checklistJson,
        subtasks_json: data.subtasksJson,
        is_global: data.isGlobal || false,
        project_id: data.projectId,
        created_by: userId,
        created_at: now,
        updated_at: now,
      },
    });
  }

  async createTaskFromTemplate(templateId: number, userId: number, columnId: number, projectId: number) {
    const template = await this.prisma.task_template.findUnique({ where: { id: templateId } });
    if (!template) throw new NotFoundException('Template non trouvé');

    const now = new Date();
    const task = await this.prisma.task.create({
      data: {
        title: template.name,
        description: template.description,
        priority: template.priority,
        status: 'TODO',
        estimated_hours: template.estimated_hours,
        task_column_id: columnId,
        project_id: projectId,
        created_by_user_id: userId,
        created_at: now,
        updated_at: now,
      },
    });

    // Créer les checklists si définies
    if (template.checklist_json) {
      try {
        const checklists = JSON.parse(template.checklist_json);
        for (const cl of checklists) {
          const checklist = await this.prisma.task_checklist.create({
            data: {
              title: cl.title,
              task_id: task.id,
              created_at: now,
              updated_at: now,
            },
          });
          if (cl.items) {
            for (let i = 0; i < cl.items.length; i++) {
              await this.prisma.task_checklist_item.create({
                data: {
                  title: cl.items[i],
                  checklist_id: checklist.id,
                  sort_order: i,
                  created_at: now,
                  updated_at: now,
                },
              });
            }
          }
        }
      } catch (e) {
        console.error('Erreur parsing checklist_json:', e);
      }
    }

    return task;
  }

  async deleteTemplate(templateId: number, userId: number) {
    const template = await this.prisma.task_template.findUnique({ where: { id: templateId } });
    if (!template) throw new NotFoundException('Template non trouvé');
    if (template.created_by !== userId) throw new ForbiddenException('Non autorité');

    return this.prisma.task_template.delete({ where: { id: templateId } });
  }

  // ============================================
  // RÉACTIONS EMOJI
  // ============================================

  async addReaction(commentId: number, userId: number, emoji: string) {
    const comment = await this.prisma.task_comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Commentaire introuvable');
    }

    return this.prisma.comment_reaction.upsert({
      where: {
        comment_id_user_id_emoji: {
          comment_id: commentId,
          user_id: userId,
          emoji: emoji,
        },
      },
      create: {
        comment_id: commentId,
        user_id: userId,
        emoji: emoji,
      },
      update: {},
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            profile_photo_url: true,
          },
        },
      },
    });
  }

  async removeReaction(commentId: number, userId: number, emoji: string) {
    try {
      return await this.prisma.comment_reaction.delete({
        where: {
          comment_id_user_id_emoji: {
            comment_id: commentId,
            user_id: userId,
            emoji: emoji,
          },
        },
      });
    } catch (error) {
      throw new NotFoundException('Réaction introuvable');
    }
  }

  async getReactions(commentId: number) {
    const reactions = await this.prisma.comment_reaction.findMany({
      where: { comment_id: commentId },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            profile_photo_url: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    const grouped = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.user);
      return acc;
    }, {});

    return Object.values(grouped);
  }

  // ============================================
  // ÉPINGLER / RÉSOUDRE COMMENTAIRES
  // ============================================

  async togglePin(commentId: number, userId: number, isPinned: boolean) {
    const comment = await this.prisma.task_comment.findUnique({
      where: { id: commentId },
      include: { task: true },
    });

    if (!comment) {
      throw new NotFoundException('Commentaire introuvable');
    }

    return this.prisma.task_comment.update({
      where: { id: commentId },
      data: {
        is_pinned: isPinned,
        updated_at: new Date(),
      },
      include: {
        user: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
      },
    });
  }

  async resolveComment(commentId: number, userId: number) {
    return this.prisma.task_comment.update({
      where: { id: commentId },
      data: {
        is_resolved: true,
        resolved_by: userId,
        resolved_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        user: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
        resolver: {
          select: { id: true, full_name: true },
        },
      },
    });
  }

  async unresolveComment(commentId: number, userId: number) {
    return this.prisma.task_comment.update({
      where: { id: commentId },
      data: {
        is_resolved: false,
        resolved_by: null,
        resolved_at: null,
        updated_at: new Date(),
      },
      include: {
        user: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
      },
    });
  }

  // ============================================
  // HISTORIQUE DES MODIFICATIONS
  // ============================================

  async getCommentHistory(commentId: number) {
    return this.prisma.comment_edit_history.findMany({
      where: { comment_id: commentId },
      include: {
        user: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
      },
      orderBy: { edited_at: 'desc' },
    });
  }
}
