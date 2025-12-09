import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

export interface RecurrenceRule {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  byDay?: string[]; // Pour WEEKLY: ['MO', 'TU', 'WE', 'TH', 'FR']
  byMonthDay?: number; // Pour MONTHLY: jour du mois
}

@Injectable()
export class TaskRecurrenceService {
  private readonly logger = new Logger(TaskRecurrenceService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Cron job qui s'exécute chaque jour à 1h du matin
   * Crée les instances de tâches récurrentes pour le jour
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async processRecurringTasks() {
    this.logger.log('Traitement des tâches récurrentes...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Récupérer les tâches récurrentes actives
      const recurringTasks = await this.prisma.task.findMany({
        where: {
          is_recurring: true,
          status: { not: 'ARCHIVED' },
          OR: [
            { recurrence_end_date: null },
            { recurrence_end_date: { gte: today } },
          ],
        },
        include: {
          task_assignment: true,
          project: true,
        },
      });

      for (const task of recurringTasks) {
        try {
          if (!task.recurrence_rule) continue;

          const rule = this.parseRecurrenceRule(task.recurrence_rule);
          if (!rule) continue;

          const shouldCreate = this.shouldCreateInstance(task, rule, today);
          
          if (shouldCreate) {
            await this.createRecurringInstance(task, today);
            this.logger.log(`Instance créée pour la tâche récurrente: ${task.title}`);
          }
        } catch (error) {
          this.logger.error(`Erreur pour la tâche ${task.id}:`, error);
        }
      }

      this.logger.log('Traitement des tâches récurrentes terminé');
    } catch (error) {
      this.logger.error('Erreur lors du traitement des tâches récurrentes:', error);
    }
  }

  /**
   * Parse la règle de récurrence (format iCalendar simplifié)
   * Exemples: "FREQ=DAILY;INTERVAL=1", "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR"
   */
  parseRecurrenceRule(ruleString: string): RecurrenceRule | null {
    try {
      const parts = ruleString.split(';');
      const rule: RecurrenceRule = {
        freq: 'DAILY',
        interval: 1,
      };

      for (const part of parts) {
        const [key, value] = part.split('=');
        switch (key) {
          case 'FREQ':
            rule.freq = value as RecurrenceRule['freq'];
            break;
          case 'INTERVAL':
            rule.interval = parseInt(value) || 1;
            break;
          case 'BYDAY':
            rule.byDay = value.split(',');
            break;
          case 'BYMONTHDAY':
            rule.byMonthDay = parseInt(value);
            break;
        }
      }

      return rule;
    } catch (error) {
      this.logger.error('Erreur parsing règle:', error);
      return null;
    }
  }

  /**
   * Vérifie si une instance doit être créée aujourd'hui
   */
  shouldCreateInstance(task: any, rule: RecurrenceRule, today: Date): boolean {
    // Trouver la dernière instance créée
    const lastInstance = task.recurring_instances?.[0];
    const lastDate = lastInstance 
      ? new Date(lastInstance.created_at) 
      : task.start_date 
        ? new Date(task.start_date) 
        : new Date(task.created_at);

    lastDate.setHours(0, 0, 0, 0);

    switch (rule.freq) {
      case 'DAILY': {
        const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= rule.interval;
      }

      case 'WEEKLY': {
        const dayOfWeek = today.getDay();
        const dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        const todayName = dayNames[dayOfWeek];

        // Vérifier si aujourd'hui est un jour prévu
        if (rule.byDay && !rule.byDay.includes(todayName)) {
          return false;
        }

        const weeksDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        return weeksDiff >= rule.interval || (weeksDiff === rule.interval - 1 && today > lastDate);
      }

      case 'MONTHLY': {
        const targetDay = rule.byMonthDay || lastDate.getDate();
        if (today.getDate() !== targetDay) {
          return false;
        }

        const monthsDiff = (today.getFullYear() - lastDate.getFullYear()) * 12 + 
                           (today.getMonth() - lastDate.getMonth());
        return monthsDiff >= rule.interval;
      }

      case 'YEARLY': {
        if (today.getMonth() !== lastDate.getMonth() || 
            today.getDate() !== lastDate.getDate()) {
          return false;
        }

        const yearsDiff = today.getFullYear() - lastDate.getFullYear();
        return yearsDiff >= rule.interval;
      }

      default:
        return false;
    }
  }

  /**
   * Crée une nouvelle instance d'une tâche récurrente
   */
  async createRecurringInstance(parentTask: any, dueDate: Date) {
    const now = new Date();

    // Créer la nouvelle tâche
    const newTask = await this.prisma.task.create({
      data: {
        title: parentTask.title,
        description: parentTask.description,
        priority: parentTask.priority,
        status: 'TODO',
        task_column_id: parentTask.task_column_id,
        project_id: parentTask.project_id,
        created_by_user_id: parentTask.created_by_user_id,
        recurring_parent_id: parentTask.id,
        start_date: dueDate,
        due_date: dueDate,
        estimated_hours: parentTask.estimated_hours,
        created_at: now,
        updated_at: now,
      },
    });

    // Copier les assignations
    if (parentTask.task_assignment?.length > 0) {
      for (const assignment of parentTask.task_assignment) {
        await this.prisma.task_assignment.create({
          data: {
            task_id: newTask.id,
            user_id: assignment.user_id,
            role: assignment.role,
            assigned_at: now,
            created_at: now,
            updated_at: now,
          },
        });
      }
    }

    // Enregistrer l'activité
    await this.prisma.task_activity.create({
      data: {
        task_id: newTask.id,
        user_id: parentTask.created_by_user_id,
        action: 'CREATED',
        new_value: 'Instance récurrente',
        created_at: now,
      },
    });

    return newTask;
  }

  /**
   * Configure une tâche comme récurrente
   */
  async setRecurrence(taskId: number, userId: number, data: {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    interval: number;
    byDay?: string[];
    byMonthDay?: number;
    endDate?: string;
  }) {
    // Construire la règle de récurrence
    let rule = `FREQ=${data.frequency};INTERVAL=${data.interval}`;
    
    if (data.byDay?.length) {
      rule += `;BYDAY=${data.byDay.join(',')}`;
    }
    
    if (data.byMonthDay) {
      rule += `;BYMONTHDAY=${data.byMonthDay}`;
    }

    const now = new Date();
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        is_recurring: true,
        recurrence_rule: rule,
        recurrence_end_date: data.endDate ? new Date(data.endDate) : null,
        updated_at: now,
        updated_by_user_id: userId,
      },
    });
  }

  /**
   * Désactive la récurrence d'une tâche
   */
  async removeRecurrence(taskId: number, userId: number) {
    const now = new Date();
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        is_recurring: false,
        recurrence_rule: null,
        recurrence_end_date: null,
        updated_at: now,
        updated_by_user_id: userId,
      },
    });
  }

  /**
   * Obtient les informations de récurrence d'une tâche
   */
  async getRecurrenceInfo(taskId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        is_recurring: true,
        recurrence_rule: true,
        recurrence_end_date: true,
        recurring_parent_id: true,
        recurring_instances: {
          take: 5,
          orderBy: { created_at: 'desc' },
          select: { id: true, title: true, status: true, created_at: true },
        },
      },
    });

    if (!task) return null;

    let parsed: RecurrenceRule | null = null;
    if (task.recurrence_rule) {
      parsed = this.parseRecurrenceRule(task.recurrence_rule);
    }

    return {
      ...task,
      parsed_rule: parsed,
    };
  }
}
