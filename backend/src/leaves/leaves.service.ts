import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { application_status, application_type } from '@prisma/client';
import { UpdateOwnLeaveDto } from './dto/update-own-leave.dto';
import { CancelOwnLeaveDto } from './dto/cancel-own-leave.dto';



@Injectable()

export class LeavesService {

  constructor(private readonly prisma: PrismaService) {}



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

        created_at: new Date(),

        updated_at: new Date(),


      },

    });



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



  async getMyBalances(userId: number) {

    return this.prisma.leave_balance.findMany({

      where: { user_id: userId },

      orderBy: [

        { year: 'desc' },

        { created_at: 'desc' },

      ],

    });

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



  async findAllLeaves() {

    return this.prisma.application.findMany({

      include: {

        leave_type: true,

        user: {

          select: {

            id: true,

            full_name: true,

            work_email: true,

            department_id: true,

            position_id: true,

            manager_user_id: true,

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

            department_id: true,

            manager_user_id: true,

          },

        },

      },

    });



    return updated;

  }


  async updateOwnLeave(userId: number, leaveId: number, dto: UpdateOwnLeaveDto) {

    if (!dto || Object.keys(dto).length === 0) {

      throw new BadRequestException('Aucune modification n\'a été fournie.');

    }



    const existing = await this.prisma.application.findUnique({

      where: { id: leaveId },

    });



    if (!existing || existing.user_id !== userId) {

      throw new NotFoundException('Demande de congé introuvable.');

    }



    if (existing.status !== application_status.Pending) {

      throw new BadRequestException('Impossible de modifier une demande qui n\'est pas en attente.');

    }



    const now = new Date();

    if (existing.start_date <= now) {

      throw new BadRequestException('Impossible de modifier une demande dont la date de début est passée.');

    }



    const targetStart = dto.start_date ? new Date(dto.start_date) : existing.start_date;

    const targetEnd = dto.end_date ? new Date(dto.end_date) : existing.end_date;



    if (targetEnd < targetStart) {

      throw new BadRequestException('La date de fin doit être postérieure à la date de début.');

    }



    if (targetStart <= now) {

      throw new BadRequestException('La date de début doit être postérieure à la date du jour.');

    }



    let approverId: number | null | undefined = undefined;

    if (dto.approver_user_id) {

      const approver = await this.prisma.user.findUnique({

        where: { id: dto.approver_user_id },

        select: { id: true, active: true },

      });



      if (!approver || !approver.active) {

        throw new NotFoundException('Le responsable sélectionné est introuvable ou inactif.');

      }



      approverId = approver.id;

    }



    if (dto.leave_type_id) {

      const leaveTypeExists = await this.prisma.leave_type.findUnique({

        where: { id: dto.leave_type_id },

        select: { id: true },

      });



      if (!leaveTypeExists) {

        throw new NotFoundException('Le type de congé sélectionné est introuvable.');

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

      throw new NotFoundException('Demande de congé introuvable.');

    }



    if (existing.status !== application_status.Pending) {

      throw new BadRequestException('Seules les demandes en attente peuvent être annulées.');

    }



    const now = new Date();

    if (existing.start_date <= now) {

      throw new BadRequestException('Impossible d\'annuler une demande dont la date de début est passée.');

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


  getApplicationTypeOptions() {

    return Object.keys(application_type);

  }

}

