import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { application_status, application_type, Prisma } from '@prisma/client';
import { UpdateOwnLeaveDto } from './dto/update-own-leave.dto';
import { CancelOwnLeaveDto } from './dto/cancel-own-leave.dto';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { RolesService, SYSTEM_PERMISSIONS } from '../roles/roles.service';
import { MailService } from '../mail/mail.service';



@Injectable()

export class LeavesService {

  private readonly logger = new Logger(LeavesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rolesService: RolesService,
    private readonly mailService: MailService,
  ) {}


  private async ensureLeaveAccess(leaveId: number, userId: number) {

    const leave = await this.prisma.application.findUnique({

      where: { id: leaveId },

      select: {

        id: true,

        user_id: true,

        approver_user_id: true,

      },

    });


    if (!leave) {

      throw new NotFoundException('Demande de conge introuvable.');

    }


    if (leave.user_id === userId || leave.approver_user_id === userId) {

      return leave;

    }


    const permissions = await this.rolesService.getUserPermissions(userId);

    const hasElevatedAccess =

      permissions.includes(SYSTEM_PERMISSIONS.LEAVES_VIEW_ALL) ||

      permissions.includes(SYSTEM_PERMISSIONS.LEAVES_APPROVE) ||

      permissions.includes('system.admin');


    if (!hasElevatedAccess) {

      throw new ForbiddenException('Acces refuse pour cette discussion de conge.');

    }


    return leave;

  }


  private formatDate(date: Date | string | null | undefined) {

    if (!date) {

      return '';

    }

 
    const value = typeof date === 'string' ? new Date(date) : date;

    return value.toLocaleDateString('fr-FR');

  }


  private getStatusLabel(status: application_status) {

    switch (status) {

      case application_status.Approved:

        return 'Approuvée';

      case application_status.Rejected:

        return 'Refusée';

      case application_status.Cancelled:

        return 'Annulée';

      default:

        return 'En attente';

    }

  }

  private readonly dayInMs = 1000 * 60 * 60 * 24;

  private normalizeDate(date: Date): Date {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  }

  private calculateLeaveDurationInDays(startDate: Date, endDate: Date): number {
    const start = this.normalizeDate(startDate);
    const end = this.normalizeDate(endDate);

    if (end < start) {
      return 0;
    }

    const diff = end.getTime() - start.getTime();
    return Math.floor(diff / this.dayInMs) + 1;
  }

  private splitLeaveDaysByYear(startDate: Date, endDate: Date) {
    const start = this.normalizeDate(startDate);
    const end = this.normalizeDate(endDate);

    if (end < start) {
      return [];
    }

    const segments: { year: number; days: number }[] = [];
    let currentStart = start;

    while (currentStart <= end) {
      const year = currentStart.getUTCFullYear();
      const yearEnd = new Date(Date.UTC(year, 11, 31));
      const segmentEnd = end < yearEnd ? end : yearEnd;
      const days = this.calculateLeaveDurationInDays(currentStart, segmentEnd);

      if (days > 0) {
        segments.push({ year, days });
      }

      currentStart = new Date(segmentEnd.getTime() + this.dayInMs);
    }

    return segments;
  }

  private calculateOverlapDays(
    startDate: Date,
    endDate: Date,
    rangeStart: Date,
    rangeEnd: Date,
  ) {
    const start = this.normalizeDate(startDate);
    const end = this.normalizeDate(endDate);
    const windowStart = this.normalizeDate(rangeStart);
    const windowEnd = this.normalizeDate(rangeEnd);

    if (end < windowStart || start > windowEnd) {
      return 0;
    }

    const overlapStart = start > windowStart ? start : windowStart;
    const overlapEnd = end < windowEnd ? end : windowEnd;

    return this.calculateLeaveDurationInDays(overlapStart, overlapEnd);
  }

  private async updateLeaveUsage(params: {
    userId: number;
    leaveTypeId: number | null | undefined;
    startDate: Date;
    endDate: Date;
    direction: 'consume' | 'release';
  }) {
    const { userId, leaveTypeId, startDate, endDate, direction } = params;

    if (!leaveTypeId) {
      this.logger.warn(`Impossible de mettre à jour le solde : aucun type de congé associé (user=${userId}).`);
      return;
    }

    const segments = this.splitLeaveDaysByYear(startDate, endDate);
    if (segments.length === 0) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      const leaveType = await tx.leave_type.findUnique({
        where: { id: leaveTypeId },
        select: { default_allowance: true },
      });

      for (const { year, days } of segments) {
        let balance = await tx.leave_balance.findFirst({
          where: { user_id: userId, leave_type_id: leaveTypeId, year },
          orderBy: { created_at: 'desc' },
        });

        if (!balance) {
          balance = await tx.leave_balance.create({
            data: {
              user_id: userId,
              leave_type_id: leaveTypeId,
              year,
              days_accrued: leaveType?.default_allowance ?? 0,
              days_used: 0,
              days_carried_over: 0,
              created_at: new Date(),
              updated_at: new Date(),
            },
          });
        }

        const delta = direction === 'consume' ? days : -days;
        const newDaysUsed = Math.max((balance.days_used ?? 0) + delta, 0);

        if (newDaysUsed === balance.days_used) {
          continue;
        }

        await tx.leave_balance.update({
          where: { id: balance.id },
          data: {
            days_used: newDaysUsed,
            updated_at: new Date(),
          },
        });
      }
    });
  }

  private async ensureLeaveBalancesForYear(userId: number, year: number) {
    const [leaveTypes, existingBalances, previousYearBalances] = await Promise.all([
      this.prisma.leave_type.findMany({
        select: { id: true, default_allowance: true },
      }),
      this.prisma.leave_balance.findMany({
        where: { user_id: userId, year },
        select: { id: true, leave_type_id: true },
      }),
      this.prisma.leave_balance.findMany({
        where: { user_id: userId, year: year - 1 },
        select: {
          leave_type_id: true,
          days_accrued: true,
          days_carried_over: true,
          days_used: true,
        },
      }),
    ]);

    const existingSet = new Set(existingBalances.map((balance) => balance.leave_type_id));
    const carryOverMap = new Map<number, number>();

    previousYearBalances.forEach((balance) => {
      const totalAvailable = (balance.days_accrued ?? 0) + (balance.days_carried_over ?? 0);
      const remaining = Math.max(totalAvailable - (balance.days_used ?? 0), 0);
      if (remaining > 0) {
        carryOverMap.set(balance.leave_type_id, remaining);
      }
    });

    const creations = leaveTypes
      .filter((type) => !existingSet.has(type.id))
      .map((type) =>
        this.prisma.leave_balance.create({
          data: {
            user_id: userId,
            leave_type_id: type.id,
            year,
            days_accrued: type.default_allowance ?? 0,
            days_used: 0,
            days_carried_over: carryOverMap.get(type.id) ?? 0,
            created_at: new Date(),
            updated_at: new Date(),
          },
        }),
      );

    if (creations.length > 0) {
      await this.prisma.$transaction(creations);
    }
  }

  private resolveUserEmail(user?: { work_email?: string | null; username?: string | null }) {

    if (!user) {

      return undefined;

    }


    const workEmail = user.work_email?.trim();

    if (workEmail && workEmail.includes('@')) {

      return workEmail;

    }


    const username = user.username?.trim();

    if (username && username.includes('@')) {

      return username;

    }


    return undefined;

  }


  private async sendEmailSafe(

    to: string | null | undefined,

    subject: string,

    text: string,

    html?: string,

  ) {

    try {

      if (!to) {

        this.logger.warn(`No primary recipient for "${subject}". Using fallback if configured.`);

      }

      await this.mailService.sendMail({

        to,

        subject,

        text,

        html: html ?? text.replace(/\n/g, '<br />'),

      });

    } catch (error) {

      const message = error instanceof Error ? error.message : String(error);

      this.logger.warn(`Email sending failed for ${to}: ${message}`);

    }

  }


  private async notifyApproverOfNewLeave(params: {

    approverEmail?: string | null;

    approverName?: string | null;

    employeeName?: string | null;

    leaveId: number;

    startDate: Date;

    endDate: Date;

    reason: string;

    leaveType?: string | null;

  }) {

    const {

      approverEmail,

      approverName,

      employeeName,

      leaveId,

      startDate,

      endDate,

      reason,

      leaveType,

    } = params;


    const subject = `Nouvelle demande de congé - ${employeeName ?? 'Employé'}`;

    const greeting = approverName ? `Bonjour ${approverName},` : 'Bonjour,';

    const formattedReason = reason?.trim?.() ?? '';

    const textLines = [

      greeting,

      '',

      `${employeeName ?? 'Un employé'} a soumis une nouvelle demande de congé (n°${leaveId}).`,

      leaveType ? `Type : ${leaveType}` : null,

      `Période : du ${this.formatDate(startDate)} au ${this.formatDate(endDate)}`,

      formattedReason ? `Motif : ${formattedReason}` : null,

      '',

      'Connectez-vous à HRMS pour valider ou commenter cette demande.',

    ].filter(Boolean);

    const text = textLines.join('\n');

    const html = textLines.map((line) => `<p>${line || '&nbsp;'}</p>`).join('');

    await this.sendEmailSafe(approverEmail ?? undefined, subject, text, html);

  }


  private async notifyEmployeeOfStatusChange(params: {

    employeeEmail?: string | null;

    employeeName?: string | null;

    approverName?: string | null;

    status: application_status;

    leaveId: number;

    startDate: Date | string | null;

    endDate: Date | string | null;

    comment?: string | null;

    leaveType?: string | null;

  }) {

    const {

      employeeEmail,

      employeeName,

      approverName,

      status,

      leaveId,

      startDate,

      endDate,

      comment,

      leaveType,

    } = params;


    const statusLabel = this.getStatusLabel(status);

    const subject = `Votre demande de congé (n°${leaveId}) est ${statusLabel.toLowerCase()}`;

    const greeting = employeeName ? `Bonjour ${employeeName},` : 'Bonjour,';

    const textLines = [

      greeting,

      '',

      `Votre demande de congé${leaveType ? ` (${leaveType})` : ''} a été ${statusLabel.toLowerCase()}.`,

      `Période : du ${this.formatDate(startDate)} au ${this.formatDate(endDate)}`,

      approverName ? `Validée par : ${approverName}` : null,

      comment ? `Commentaire : ${comment}` : null,

      '',

      'Connectez-vous à HRMS pour consulter les détails.',

    ].filter(Boolean);

    const text = textLines.join('\n');

    const html = textLines.map((line) => `<p>${line || '&nbsp;'}</p>`).join('');

    await this.sendEmailSafe(employeeEmail ?? undefined, subject, text, html);

  }


  private async notifyParticipantsOfComment(params: {

    recipients: Array<{ email?: string | null; name?: string | null }>;

    authorName?: string | null;

    leaveId: number;

    message: string;

  }) {

    const { recipients, authorName, leaveId, message } = params;

    const subject = `Nouveau commentaire sur la demande de congé n°${leaveId}`;

    await Promise.all(

      recipients

        .filter((recipient) => recipient.email)

        .map((recipient) => {

          const greeting = `Bonjour ${recipient.name ?? ''}`.trim();

          const textLines = [

            greeting,

            '',

            `${authorName ?? 'Un membre de votre Ã©quipe'} a laissÃ© un commentaire sur la demande #${leaveId}.`,

            '',

            'Message :',

            message,

            '',

            'Connectez-vous à HRMS pour répondre.',

          ];

          const text = textLines.join('\n');

          const html = textLines.map((line) => `<p>${line || '&nbsp;'}</p>`).join('');

          return this.sendEmailSafe(

            recipient.email ?? undefined,

            subject,

            text,

            html,

          );

        }),

    );

  }



  async create(userId: number, dto: CreateLeaveDto) {

    const { type, start_date, end_date, reason, approver_user_id } = dto;



    const startDate = new Date(start_date);

    const endDate = new Date(end_date);



    if (endDate < startDate) {

      throw new BadRequestException('La date de fin doit tre postrieure  la date de dbut.');

    }



    const requester = await this.prisma.user.findUnique({

      where: { id: userId },

      select: {

        id: true,

        manager_user_id: true,

      },

    });



    if (!requester) {

      throw new NotFoundException('Utilisateur introuvable.');

    }



    let approverId: number | null = null;



    if (approver_user_id) {

      const approver = await this.prisma.user.findUnique({

        where: { id: approver_user_id },

        select: { id: true, active: true },

      });



      if (!approver || !approver.active) {

        throw new NotFoundException('Le responsable slectionn est introuvable ou inactif.');

      }



      approverId = approver.id;

    } else if (requester.manager_user_id) {

      approverId = requester.manager_user_id;

    }



    const application = await this.prisma.application.create({

      data: {

        user_id: userId,

        reason,

        start_date: startDate,

        end_date: endDate,

        type: type as application_type,

        status: application_status.Pending,

        workflow_step: 'Pending',

        approver_user_id: approverId,

        leave_type_id: dto.leave_type_id ?? null,

        created_at: new Date(),

        updated_at: new Date(),


      },

    });



    if (approverId) {

      const [approverInfo, employeeInfo, leaveType] = await Promise.all([

        this.prisma.user.findUnique({

          where: { id: approverId },

          select: {

            full_name: true,

            work_email: true,

            username: true,

          },

        }),

        this.prisma.user.findUnique({

          where: { id: userId },

          select: {

            full_name: true,

            work_email: true,

            username: true,

          },

        }),

        dto.leave_type_id

          ? this.prisma.leave_type.findUnique({

              where: { id: dto.leave_type_id },

              select: { name: true },

            })

          : Promise.resolve(null),

      ]);


      await this.notifyApproverOfNewLeave({

        approverEmail: this.resolveUserEmail(approverInfo ?? undefined),

        approverName: approverInfo?.full_name,

        employeeName: employeeInfo?.full_name,

        leaveId: application.id,

        startDate,

        endDate,

        reason,

        leaveType: leaveType?.name ?? type,

      });

    }



    return application;

  }



  async findMy(userId: number) {

    return this.prisma.application.findMany({

      where: { user_id: userId },

      orderBy: {

        created_at: 'desc',

      },

    });

  }


  async findMyUpdates(userId: number) {

    return this.prisma.application.findMany({

      where: {

        user_id: userId,

        status: {

          in: [

            application_status.Approved,

            application_status.Rejected,

            application_status.Cancelled,

          ],

        },

      },

      include: {

        leave_type: true,

      },

      orderBy: {

        updated_at: 'desc',

      },

      take: 20,

    });

  }


  async getLeaveMessages(leaveId: number, userId: number) {

    await this.ensureLeaveAccess(leaveId, userId);

    return this.prisma.leave_message.findMany({

      where: { application_id: leaveId },

      orderBy: { created_at: 'asc' },

      include: {

        author: {

          select: {

            id: true,

            full_name: true,

            work_email: true,

          },

        },

      },

    });

  }


  async createLeaveMessage(leaveId: number, userId: number, message: string) {

    const trimmed = message?.trim();

    if (!trimmed || trimmed.length === 0) {

      throw new BadRequestException('Le message ne peut pas etre vide.');

    }


    const leaveAccess = await this.ensureLeaveAccess(leaveId, userId);

    const now = new Date();


    const [created] = await this.prisma.$transaction([

      this.prisma.leave_message.create({

        data: {

          application_id: leaveId,

          author_user_id: userId,

          message: trimmed,

          created_at: now,

        },

        include: {

          author: {

            select: {

              id: true,

              full_name: true,

              work_email: true,

              username: true,

            },

          },

        },

      }),

      this.prisma.application.update({

        where: { id: leaveId },

        data: { updated_at: now },

        select: { id: true },

      }),

    ]);


    const [employeeInfo, approverInfo] = await Promise.all([

      this.prisma.user.findUnique({

        where: { id: leaveAccess.user_id },

        select: {

          full_name: true,

          work_email: true,

          username: true,

        },

      }),

      leaveAccess.approver_user_id

        ? this.prisma.user.findUnique({

            where: { id: leaveAccess.approver_user_id },

            select: {

              full_name: true,

              work_email: true,

              username: true,

            },

          })

        : Promise.resolve(null),

    ]);


    const recipients: Array<{ email?: string | null; name?: string | null }> = [];

    if (leaveAccess.user_id !== userId) {

      const email = this.resolveUserEmail(employeeInfo ?? undefined);

      if (email) {

        recipients.push({

          email,

          name: employeeInfo?.full_name ?? undefined,

        });

      } else {

        this.logger.warn(

          `Impossible d'envoyer l'email de commentaire : aucun email trouvÃ© pour l'employÃ© (ID ${leaveAccess.user_id}).`,

        );

      }

    }

    if (leaveAccess.approver_user_id && leaveAccess.approver_user_id !== userId) {

      const email = this.resolveUserEmail(approverInfo ?? undefined);

      if (email) {

        recipients.push({

          email,

          name: approverInfo?.full_name ?? undefined,

        });

      } else {

        this.logger.warn(

          `Impossible d'envoyer l'email de commentaire : aucun email trouvÃ© pour le responsable (ID ${leaveAccess.approver_user_id}).`,

        );

      }

    }


    if (recipients.length > 0) {

      await this.notifyParticipantsOfComment({

        recipients,

        authorName: created.author?.full_name ?? undefined,

        leaveId,

        message: created.message,

      });

    }


    return created;

  }



  async getMyBalances(userId: number) {
    const currentYear = new Date().getFullYear();
    await this.ensureLeaveBalancesForYear(userId, currentYear);

    const balances = await this.prisma.leave_balance.findMany({
      where: { user_id: userId },
      include: {
        leave_type: true,
      },
      orderBy: [
        { year: 'desc' },
        { created_at: 'desc' },
      ],
    });

    const monthlyTypeIds = balances
      .filter(
        (balance) =>
          balance.leave_type_id &&
          (balance.leave_type?.monthly_allowance ?? null) !== null &&
          (balance.leave_type?.monthly_allowance ?? 0) > 0,
      )
      .map((balance) => balance.leave_type_id) as number[];

    const monthlyUsageMap = new Map<number, number>();

    if (monthlyTypeIds.length > 0) {
      const now = new Date();
      const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
      const monthEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));

      const monthlyApplications = await this.prisma.application.findMany({
        where: {
          user_id: userId,
          status: application_status.Approved,
          leave_type_id: { in: monthlyTypeIds },
          start_date: { lte: monthEnd },
          end_date: { gte: monthStart },
        },
        select: {
          leave_type_id: true,
          start_date: true,
          end_date: true,
        },
      });

      monthlyApplications.forEach((application) => {
        if (!application.leave_type_id) {
          return;
        }
        const days = this.calculateOverlapDays(
          application.start_date,
          application.end_date,
          monthStart,
          monthEnd,
        );
        const current = monthlyUsageMap.get(application.leave_type_id) ?? 0;
        monthlyUsageMap.set(application.leave_type_id, current + days);
      });
    }

    return balances.map((balance) => ({
      ...balance,
      monthly_allowance: balance.leave_type?.monthly_allowance ?? null,
      monthly_used: monthlyUsageMap.get(balance.leave_type_id) ?? 0,
    }));
  }

  async getAllBalances(year: number) {
    const balances = await this.prisma.leave_balance.findMany({
      where: { year },
      include: {
        leave_type: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            full_name: true,
            work_email: true,
            department: {
              select: { department_name: true },
            },
          },
        },
      },
      orderBy: [
        { user: { full_name: 'asc' } },
        { leave_type: { name: 'asc' } },
      ],
    });

    return balances.map((balance) => ({
      ...balance,
      days_remaining: (balance.days_accrued || 0) - (balance.days_used || 0),
      days_pending: 0, // À calculer si nécessaire
    }));
  }

  async getApprovers(userId: number) {
    const requester = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { manager_user_id: true },
    });

    if (!requester) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    const approversMap = new Map<number, { id: number; full_name: string; work_email: string | null }>();

    if (requester.manager_user_id) {
      const directManager = await this.prisma.user.findUnique({
        where: { id: requester.manager_user_id },
        select: { id: true, full_name: true, work_email: true, active: true },
      });

      if (directManager && directManager.active) {
        approversMap.set(directManager.id, {
          id: directManager.id,
          full_name: directManager.full_name,
          work_email: directManager.work_email ?? null,
        });
      }
    }

    const additionalManagers = await this.prisma.user.findMany({
      where: {
        active: true,
        OR: [{ role: 'ROLE_MANAGER' }, { role: 'ROLE_RH' }],
      },
      select: { id: true, full_name: true, work_email: true },
      orderBy: { full_name: 'asc' },
    });

    additionalManagers.forEach((manager) => {
      approversMap.set(manager.id, {
        id: manager.id,
        full_name: manager.full_name,
        work_email: manager.work_email ?? null,
      });
    });

    return Array.from(approversMap.values());
  }


  async findTeamLeaves(managerId: number) {

    return this.prisma.application.findMany({

      where: {

        user: {

          manager_user_id: managerId,

        },

      },

      include: {

        leave_type: true,

        user: {

          select: {

            id: true,

            full_name: true,

            work_email: true,

            department_id: true,

            position_id: true,

          },

        },

      },

      orderBy: {

        created_at: 'desc',

      },

    });

  }


  async findAssignedLeaves(
    approverId: number,
    status?: application_status | 'all',
  ) {

    const where: Prisma.applicationWhereInput = {

      approver_user_id: approverId,

    };


    if (!status) {

      where.status = application_status.Pending;

    } else if (status !== 'all') {

      where.status = status;

    }


    return this.prisma.application.findMany({

      where,

      include: {

        leave_type: true,

        user: {

          select: {

            id: true,

            full_name: true,

            work_email: true,

            department_id: true,

            position_id: true,

          },

        },

      },

      orderBy: {

        created_at: 'desc',

      },

    });

  }


  async countPendingApprovals(approverId: number) {

    return this.prisma.application.count({

      where: {

        approver_user_id: approverId,

        status: application_status.Pending,

      },

    });

  }



  async findAllLeaves() {
    return this.prisma.application.findMany({
      include: {
        leave_type: true,
        user: {
          select: {
            id: true,
            full_name: true,
            work_email: true,
            username: true,
            department_id: true,
            position_id: true,
            manager_user_id: true,
            department: {
              select: { department_name: true },
            },
            position: {
              select: { title: true },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }



  async updateStatus(leaveId: number, approverId: number, dto: UpdateLeaveStatusDto) {

    const existing = await this.prisma.application.findUnique({

      where: { id: leaveId },

    });



    if (!existing) {

      throw new NotFoundException('Demande de cong introuvable.');

    }



    const now = new Date();

    let approvedAt: Date | null = existing.approved_at;

    const trimmedComment = dto.approver_comment?.trim();



    if (dto.status === application_status.Approved) {

      approvedAt = now;

    } else if (dto.status === application_status.Pending) {

      approvedAt = null;

    } else if ([application_status.Rejected, application_status.Cancelled].includes(dto.status)) {

      approvedAt = null;

    }



    const updated = await this.prisma.application.update({

      where: { id: leaveId },

      data: {

        status: dto.status,

        workflow_step: dto.workflow_step?.trim() || existing.workflow_step || dto.status,

        approver_comment: trimmedComment && trimmedComment.length > 0 ? trimmedComment : null,

        approver_user_id: approverId,

        approved_at: approvedAt,

        updated_at: now,

      },

      include: {

        leave_type: true,

        user: {

          select: {

            id: true,

            full_name: true,

            work_email: true,

            username: true,

            department_id: true,

            manager_user_id: true,

          },

        },

      },

    });

    if (trimmedComment && trimmedComment.length > 0) {

      await this.prisma.leave_message.create({

        data: {

          application_id: leaveId,

          author_user_id: approverId,

          message: trimmedComment,

          created_at: now,

        },

      });

    }

    const wasApproved = existing.status === application_status.Approved;
    const isNowApproved = updated.status === application_status.Approved;

    if (isNowApproved && !wasApproved) {
      await this.updateLeaveUsage({
        userId: existing.user_id,
        leaveTypeId: updated.leave_type?.id ?? existing.leave_type_id,
        startDate: updated.start_date,
        endDate: updated.end_date,
        direction: 'consume',
      });
    } else if (wasApproved && !isNowApproved) {
      await this.updateLeaveUsage({
        userId: existing.user_id,
        leaveTypeId: updated.leave_type?.id ?? existing.leave_type_id,
        startDate: updated.start_date,
        endDate: updated.end_date,
        direction: 'release',
      });
    }

    const approverInfo = await this.prisma.user.findUnique({

      where: { id: approverId },

      select: {

        full_name: true,

        work_email: true,

        username: true,

      },

    });


    await this.notifyEmployeeOfStatusChange({

      employeeEmail: this.resolveUserEmail(updated.user ?? undefined),

      employeeName: updated.user?.full_name,

      approverName: approverInfo?.full_name,

      status: updated.status,

      leaveId: updated.id,

      startDate: updated.start_date,

      endDate: updated.end_date,

      comment: trimmedComment ?? updated.approver_comment,

      leaveType: updated.leave_type?.name ?? undefined,

    });


    return updated;

  }


  async updateOwnLeave(userId: number, leaveId: number, dto: UpdateOwnLeaveDto) {

    if (!dto || Object.keys(dto).length === 0) {

      throw new BadRequestException('Aucune modification n\'a Ã©tÃ© fournie.');

    }



    const existing = await this.prisma.application.findUnique({

      where: { id: leaveId },

    });



    if (!existing || existing.user_id !== userId) {

      throw new NotFoundException('Demande de congÃ© introuvable.');

    }



    if (existing.status !== application_status.Pending) {

      throw new BadRequestException('Impossible de modifier une demande qui n\'est pas en attente.');

    }



    const now = new Date();

    if (existing.start_date <= now) {

      throw new BadRequestException('Impossible de modifier une demande dont la date de dÃ©but est passÃ©e.');

    }



    const targetStart = dto.start_date ? new Date(dto.start_date) : existing.start_date;

    const targetEnd = dto.end_date ? new Date(dto.end_date) : existing.end_date;



    if (targetEnd < targetStart) {

      throw new BadRequestException('La date de fin doit Ãªtre postÃ©rieure Ã  la date de dÃ©but.');

    }



    if (targetStart <= now) {

      throw new BadRequestException('La date de dÃ©but doit Ãªtre postÃ©rieure Ã  la date du jour.');

    }



    let approverId: number | null | undefined = undefined;

    if (dto.approver_user_id) {

      const approver = await this.prisma.user.findUnique({

        where: { id: dto.approver_user_id },

        select: { id: true, active: true },

      });



      if (!approver || !approver.active) {

        throw new NotFoundException('Le responsable sÃ©lectionnÃ© est introuvable ou inactif.');

      }



      approverId = approver.id;

    }



    if (dto.leave_type_id) {

      const leaveTypeExists = await this.prisma.leave_type.findUnique({

        where: { id: dto.leave_type_id },

        select: { id: true },

      });



      if (!leaveTypeExists) {

        throw new NotFoundException('Le type de congÃ© sÃ©lectionnÃ© est introuvable.');

      }

    }



    const trimmedReason = dto.reason?.trim();



    const updated = await this.prisma.application.update({

      where: { id: leaveId },

      data: {

        type: dto.type ?? existing.type,

        start_date: targetStart,

        end_date: targetEnd,

        reason: trimmedReason ?? existing.reason,

        leave_type_id: dto.leave_type_id !== undefined ? dto.leave_type_id : existing.leave_type_id,

        approver_user_id: approverId ?? existing.approver_user_id,

        workflow_step: 'Pending',

        approved_at: null,

        approver_comment: null,

        updated_at: now,

      },

      include: {

        leave_type: true,

      },

    });



    return updated;

  }



  async cancelOwnLeave(userId: number, leaveId: number, dto: CancelOwnLeaveDto) {

    const existing = await this.prisma.application.findUnique({

      where: { id: leaveId },

    });



    if (!existing || existing.user_id !== userId) {

      throw new NotFoundException('Demande de congÃ© introuvable.');

    }



    if (existing.status !== application_status.Pending) {

      throw new BadRequestException('Seules les demandes en attente peuvent Ãªtre annulÃ©es.');

    }



    const now = new Date();

    if (existing.start_date <= now) {

      throw new BadRequestException('Impossible d\'annuler une demande dont la date de dÃ©but est passÃ©e.');

    }



    const trimmedReason = dto.reason?.trim();



    const updated = await this.prisma.application.update({

      where: { id: leaveId },

      data: {

        status: application_status.Cancelled,

        workflow_step: 'Cancelled',

        approver_comment: trimmedReason && trimmedReason.length > 0 ? trimmedReason : existing.approver_comment,

        approved_at: null,

        updated_at: now,

      },

      include: {

        leave_type: true,

      },

    });



    return updated;

  }



  async getLeaveTypes() {

    return this.prisma.leave_type.findMany();

  }

  async createLeaveType(dto: CreateLeaveTypeDto) {
    const trimmedName = dto.name.trim();
    if (trimmedName.length === 0) {
      throw new BadRequestException('Le nom du type de congé ne peut pas être vide.');
    }

    const existing = await this.prisma.leave_type.findFirst({
      where: {
        name: trimmedName,
      },
    });

    if (existing) {
      throw new BadRequestException('Un type de congé portant ce nom existe déjà.');
    }

    const trimmedDescription = dto.description?.trim();
    const defaultAllowance =
      dto.default_allowance !== undefined && dto.default_allowance !== null
        ? dto.default_allowance
        : 0;

    const monthlyAllowance =
      dto.monthly_allowance !== undefined && dto.monthly_allowance !== null
        ? dto.monthly_allowance
        : null;

    const leaveType = await this.prisma.leave_type.create({
      data: {
        name: trimmedName,
        description: trimmedDescription && trimmedDescription.length > 0 ? trimmedDescription : null,
        default_allowance: defaultAllowance,
        monthly_allowance: monthlyAllowance,
        requires_approval: dto.requires_approval ?? true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return leaveType;
  }

  async updateLeaveType(leaveTypeId: number, dto: UpdateLeaveTypeDto) {
    const existing = await this.prisma.leave_type.findUnique({
      where: { id: leaveTypeId },
    });

    if (!existing) {
      throw new NotFoundException('Type de congé introuvable.');
    }

    const data: Prisma.leave_typeUpdateInput = {
      updated_at: new Date(),
    };

    if (dto.name !== undefined) {
      const trimmedName = dto.name.trim();
      if (trimmedName.length === 0) {
        throw new BadRequestException('Le nom du type de congé ne peut pas être vide.');
      }
      data.name = trimmedName;
    }

    if (dto.description !== undefined) {
      const trimmedDescription = dto.description?.trim();
      data.description = trimmedDescription && trimmedDescription.length > 0 ? trimmedDescription : null;
    }

    if (dto.default_allowance !== undefined) {
      data.default_allowance = dto.default_allowance;
    }

    if (dto.monthly_allowance !== undefined) {
      data.monthly_allowance = dto.monthly_allowance;
    }

    if (dto.requires_approval !== undefined) {
      data.requires_approval = dto.requires_approval;
    }

    const updated = await this.prisma.leave_type.update({
      where: { id: leaveTypeId },
      data,
    });

    if (dto.default_allowance !== undefined) {
      const currentYear = new Date().getFullYear();
      await this.prisma.leave_balance.updateMany({
        where: { leave_type_id: leaveTypeId, year: currentYear },
        data: {
          days_accrued: dto.default_allowance,
          updated_at: new Date(),
        },
      });
    }

    return updated;
  }


  getApplicationTypeOptions() {

    return Object.keys(application_type);

  }

}




