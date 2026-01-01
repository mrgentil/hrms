import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class TaskRemindersService {
  private readonly logger = new Logger(TaskRemindersService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) { }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cron job qui s'exécute tous les jours à 8h du matin
   * Envoie des rappels pour les tâches dont l'échéance est proche
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendDueDateReminders() {
    this.logger.log('Vérification des rappels de tâches...');

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    try {
      // 1. Tâches dont l'échéance est AUJOURD'HUI
      const tasksDueToday = await this.prisma.task.findMany({
        where: {
          due_date: {
            gte: today,
            lt: tomorrow,
          },
          status: {
            not: 'DONE',
          },
        },
        include: {
          task_assignment: {
            include: {
              user: {
                select: { id: true, full_name: true, work_email: true },
              },
            },
          },
          project: true,
        },
      });

      // Envoyer des notifications pour chaque tâche due aujourd'hui
      for (const task of tasksDueToday) {
        await this.sendReminder(task, 'today');
        await this.sleep(600); // Respect Resend rate limit (2 req/s)
      }

      // 2. Tâches dont l'échéance est DEMAIN
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      const tasksDueTomorrow = await this.prisma.task.findMany({
        where: {
          due_date: {
            gte: tomorrow,
            lt: dayAfterTomorrow,
          },
          status: {
            not: 'DONE',
          },
        },
        include: {
          task_assignment: {
            include: {
              user: {
                select: { id: true, full_name: true, work_email: true },
              },
            },
          },
          project: true,
        },
      });

      for (const task of tasksDueTomorrow) {
        await this.sendReminder(task, 'tomorrow');
        await this.sleep(600); // Respect Resend rate limit (2 req/s)
      }

      // 3. Tâches EN RETARD
      const overdueTasks = await this.prisma.task.findMany({
        where: {
          due_date: {
            lt: today,
          },
          status: {
            not: 'DONE',
          },
        },
        include: {
          task_assignment: {
            include: {
              user: {
                select: { id: true, full_name: true, work_email: true },
              },
            },
          },
          project: true,
        },
      });

      for (const task of overdueTasks) {
        await this.sendReminder(task, 'overdue');
        await this.sleep(600); // Respect Resend rate limit (2 req/s)
      }

      this.logger.log(`Rappels envoyés: ${tasksDueToday.length} aujourd'hui, ${tasksDueTomorrow.length} demain, ${overdueTasks.length} en retard`);
    } catch (error) {
      this.logger.error('Erreur lors de l\'envoi des rappels:', error);
    }
  }

  private async sendReminder(task: any, type: 'today' | 'tomorrow' | 'overdue') {
    const assignees = task.task_assignment || [];

    // Déterminer le message selon le type
    let title: string;
    let urgencyColor: string;
    let emoji: string;

    switch (type) {
      case 'today':
        title = `⏰ Tâche à terminer aujourd'hui`;
        urgencyColor = '#f59e0b'; // Orange
        emoji = '⏰';
        break;
      case 'tomorrow':
        title = `📅 Rappel: Tâche à terminer demain`;
        urgencyColor = '#3b82f6'; // Blue
        emoji = '📅';
        break;
      case 'overdue':
        title = `🚨 Tâche en retard!`;
        urgencyColor = '#ef4444'; // Red
        emoji = '🚨';
        break;
    }

    const message = `La tâche "${task.title}" ${type === 'overdue'
        ? 'est en retard'
        : type === 'today'
          ? 'doit être terminée aujourd\'hui'
          : 'doit être terminée demain'
      } dans le projet "${task.project?.name || 'Projet'}"`;

    // Envoyer notification à chaque assigné
    for (const assignment of assignees) {
      const user = assignment.user;
      if (!user) continue;

      // Créer notification in-app
      try {
        await this.prisma.notification.create({
          data: {
            user_id: user.id,
            title,
            message,
            type: 'TASK_DUE',
            entity_type: 'task',
            entity_id: task.id,
            link: `/projects?task=${task.id}`,
            is_read: false,
            created_at: new Date(),
          },
        });
      } catch (error) {
        this.logger.error(`Erreur création notification pour ${user.id}:`, error);
      }

      // Envoyer email
      if (user.work_email) {
        try {
          await this.mailService.sendMail({
            to: user.work_email,
            subject: `${emoji} ${title} - ${task.title}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, ${urgencyColor}, ${urgencyColor}dd); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
                  <span style="font-size: 48px;">${emoji}</span>
                  <h2 style="color: white; margin: 10px 0 0 0;">${title}</h2>
                </div>
                <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 12px 12px;">
                  <p>Bonjour <strong>${user.full_name}</strong>,</p>
                  <p>${message}</p>
                  
                  <div style="background: white; padding: 16px; border-radius: 8px; border-left: 4px solid ${urgencyColor}; margin: 20px 0;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937;">${task.title}</h3>
                    ${task.description ? `<p style="color: #6b7280; margin: 0 0 8px 0;">${task.description.substring(0, 150)}${task.description.length > 150 ? '...' : ''}</p>` : ''}
                    <p style="color: #6b7280; margin: 0;">
                      <strong>Projet:</strong> ${task.project?.name || 'Non spécifié'}<br/>
                      <strong>Échéance:</strong> ${task.due_date ? new Date(task.due_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Non définie'}
                    </p>
                  </div>
                  
                  <p style="text-align: center;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects?task=${task.id}" 
                       style="display: inline-block; background: ${urgencyColor}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                      Voir la tâche
                    </a>
                  </p>
                  
                  <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; text-align: center;">
                    — L'équipe HRMS
                  </p>
                </div>
              </div>
            `,
          });
        } catch (error) {
          this.logger.error(`Erreur envoi email à ${user.work_email}:`, error);
        }
      }
    }
  }

  /**
   * Méthode pour tester manuellement l'envoi de rappels
   */
  async testReminders() {
    await this.sendDueDateReminders();
    return { success: true, message: 'Rappels envoyés (test)' };
  }
}
