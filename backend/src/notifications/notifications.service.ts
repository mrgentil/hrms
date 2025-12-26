import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto, NotificationType } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        user_id: dto.user_id,
        type: dto.type as any,
        title: dto.title,
        message: dto.message,
        link: dto.link,
        entity_type: dto.entity_type,
        entity_id: dto.entity_id,
      },
    });
  }

  async createMany(notifications: CreateNotificationDto[]) {
    return this.prisma.notification.createMany({
      data: notifications.map(n => ({
        user_id: n.user_id,
        type: n.type as any,
        title: n.title,
        message: n.message,
        link: n.link,
        entity_type: n.entity_type,
        entity_id: n.entity_id,
      })),
    });
  }

  async findAllForUser(userId: number, limit = 50) {
    return this.prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  async findUnreadForUser(userId: number) {
    return this.prisma.notification.findMany({
      where: { user_id: userId, is_read: false },
      orderBy: { created_at: 'desc' },
    });
  }

  async getUnreadCount(userId: number) {
    return this.prisma.notification.count({
      where: { user_id: userId, is_read: false },
    });
  }

  async markAsRead(userId: number, notificationIds?: number[]) {
    if (notificationIds && notificationIds.length > 0) {
      return this.prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          user_id: userId,
        },
        data: {
          is_read: true,
          read_at: new Date(),
        },
      });
    }
    return { count: 0 };
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  }

  async delete(userId: number, notificationId: number) {
    return this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        user_id: userId,
      },
    });
  }

  async deleteAll(userId: number) {
    return this.prisma.notification.deleteMany({
      where: { user_id: userId },
    });
  }

  // Helper methods for common notifications

  async notifyProjectAdded(userId: number, projectId: number, projectName: string, addedBy: string) {
    return this.create({
      user_id: userId,
      type: NotificationType.PROJECT_ADDED,
      title: 'Ajouté à un projet',
      message: `${addedBy} vous a ajouté au projet "${projectName}"`,
      link: `/projects/${projectId}`,
      entity_type: 'project',
      entity_id: projectId,
    });
  }

  async notifyProjectRemoved(userId: number, projectName: string, removedBy: string) {
    return this.create({
      user_id: userId,
      type: NotificationType.PROJECT_REMOVED,
      title: 'Retiré d\'un projet',
      message: `${removedBy} vous a retiré du projet "${projectName}"`,
      entity_type: 'project',
    });
  }

  async notifyTaskAssigned(userId: number, taskId: number, taskTitle: string, projectId: number, assignedBy: string) {
    return this.create({
      user_id: userId,
      type: NotificationType.TASK_ASSIGNED,
      title: 'Nouvelle tâche assignée',
      message: `${assignedBy} vous a assigné la tâche "${taskTitle}"`,
      link: `/projects/${projectId}`,
      entity_type: 'task',
      entity_id: taskId,
    });
  }

  async notifyTaskUnassigned(userId: number, taskTitle: string, unassignedBy: string) {
    return this.create({
      user_id: userId,
      type: NotificationType.TASK_UNASSIGNED,
      title: 'Tâche désassignée',
      message: `${unassignedBy} vous a retiré de la tâche "${taskTitle}"`,
      entity_type: 'task',
    });
  }

  async notifyTaskCompleted(userId: number, taskId: number, taskTitle: string, projectId: number, completedBy: string) {
    return this.create({
      user_id: userId,
      type: NotificationType.TASK_COMPLETED,
      title: 'Tâche terminée',
      message: `${completedBy} a terminé la tâche "${taskTitle}"`,
      link: `/projects/${projectId}`,
      entity_type: 'task',
      entity_id: taskId,
    });
  }

  async notifyLeaveApproved(userId: number, leaveId: number, approvedBy: string) {
    return this.create({
      user_id: userId,
      type: NotificationType.LEAVE_APPROVED,
      title: 'Congé approuvé',
      message: `${approvedBy} a approuvé votre demande de congé`,
      link: `/leaves/my-leaves`,
      entity_type: 'leave',
      entity_id: leaveId,
    });
  }

  async notifyLeaveRejected(userId: number, leaveId: number, rejectedBy: string, reason?: string) {
    return this.create({
      user_id: userId,
      type: NotificationType.LEAVE_REJECTED,
      title: 'Congé refusé',
      message: reason
        ? `${rejectedBy} a refusé votre demande de congé: ${reason}`
        : `${rejectedBy} a refusé votre demande de congé`,
      link: `/leaves/my-leaves`,
      entity_type: 'leave',
      entity_id: leaveId,
    });
  }

  async notifyNewMessage(userId: number, conversationId: number, senderName: string) {
    return this.create({
      user_id: userId,
      type: NotificationType.MESSAGE,
      title: 'Nouveau message',
      message: `${senderName} vous a envoyé un message`,
      link: `/messages`,
      entity_type: 'conversation',
      entity_id: conversationId,
    });
  }

  // Fund Request Notifications

  async notifyFundRequestSubmitted(
    reviewerUserId: number,
    fundRequestId: number,
    requesterName: string,
    amount: number,
    reason: string,
  ) {
    const formattedAmount = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

    return this.create({
      user_id: reviewerUserId,
      type: NotificationType.FUND_REQUEST_SUBMITTED,
      title: 'Nouvelle demande de fonds',
      message: `${requesterName} a soumis une demande de ${formattedAmount} - ${reason.substring(0, 50)}${reason.length > 50 ? '...' : ''}`,
      link: `/payroll/fund-requests`,
      entity_type: 'fund_request',
      entity_id: fundRequestId,
    });
  }

  async notifyFundRequestApproved(
    requesterUserId: number,
    fundRequestId: number,
    approverName: string,
    comment?: string,
  ) {
    return this.create({
      user_id: requesterUserId,
      type: NotificationType.FUND_REQUEST_APPROVED,
      title: 'Demande de fonds approuvée',
      message: comment
        ? `${approverName} a approuvé votre demande de fonds: ${comment}`
        : `${approverName} a approuvé votre demande de fonds`,
      link: `/payroll/fund-requests`,
      entity_type: 'fund_request',
      entity_id: fundRequestId,
    });
  }

  async notifyFundRequestRejected(
    requesterUserId: number,
    fundRequestId: number,
    rejectorName: string,
    reason?: string,
  ) {
    return this.create({
      user_id: requesterUserId,
      type: NotificationType.FUND_REQUEST_REJECTED,
      title: 'Demande de fonds refusée',
      message: reason
        ? `${rejectorName} a refusé votre demande de fonds: ${reason}`
        : `${rejectorName} a refusé votre demande de fonds`,
      link: `/payroll/fund-requests`,
      entity_type: 'fund_request',
      entity_id: fundRequestId,
    });
  }

  async notifyFundRequestPaid(
    requesterUserId: number,
    fundRequestId: number,
    payerName: string,
    amount: number,
    paymentMethod?: string,
  ) {
    const formattedAmount = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

    return this.create({
      user_id: requesterUserId,
      type: NotificationType.FUND_REQUEST_PAID,
      title: 'Demande de fonds payée',
      message: paymentMethod
        ? `${payerName} a effectué le paiement de ${formattedAmount} par ${paymentMethod}`
        : `${payerName} a effectué le paiement de ${formattedAmount}`,
      link: `/payroll/fund-requests`,
      entity_type: 'fund_request',
      entity_id: fundRequestId,
    });
  }

  async notifyTrainingApproved(userId: number, trainingId: number, trainingTitle: string, approvedBy: string) {
    return this.create({
      user_id: userId,
      type: NotificationType.TRAINING_APPROVED,
      title: 'Inscription Approuvée',
      message: `${approvedBy} a approuvé votre inscription à la formation "${trainingTitle}"`,
      link: `/training/my-trainings`,
      entity_type: 'training',
      entity_id: trainingId,
    });
  }

  async notifyTrainingRejected(userId: number, trainingId: number, trainingTitle: string, rejectedBy: string, reason?: string) {
    return this.create({
      user_id: userId,
      type: NotificationType.TRAINING_REJECTED,
      title: 'Inscription Refusée',
      message: reason
        ? `${rejectedBy} a refusé votre inscription à "${trainingTitle}": ${reason}`
        : `${rejectedBy} a refusé votre inscription à "${trainingTitle}"`,
      link: `/training/my-trainings`,
      entity_type: 'training',
      entity_id: trainingId,
    });
  }

  async notifyBadgeEarned(userId: number, moduleId: number, moduleTitle: string) {
    return this.create({
      user_id: userId,
      type: NotificationType.ELEARNING_BADGE_EARNED,
      title: 'Nouveau Badge ! 🏆',
      message: `Félicitations ! Vous avez terminé le module "${moduleTitle}" et gagné un nouveau badge.`,
      link: `/training/elearning`,
      entity_type: 'elearning_module',
      entity_id: moduleId,
    });
  }

  async notifyNewTrainingRegistration(userId: number, trainingId: number, trainingTitle: string, userName: string) {
    const admins = await this.prisma.user.findMany({
      where: {
        role: { in: ['ROLE_SUPER_ADMIN' as any, 'ROLE_RH' as any] },
      },
    });

    const notifications = admins.map(admin => ({
      user_id: admin.id,
      type: NotificationType.TRAINING_REGISTERED,
      title: 'Nouvelle Inscription',
      message: `${userName} s'est inscrit à la formation "${trainingTitle}"`,
      link: `/training/registrations`,
      entity_type: 'training',
      entity_id: trainingId,
    }));

    return this.createMany(notifications);
  }
}
