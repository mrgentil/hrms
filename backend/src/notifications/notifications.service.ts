import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto, NotificationType } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        user_id: dto.user_id,
        type: dto.type,
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
        type: n.type,
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
}
