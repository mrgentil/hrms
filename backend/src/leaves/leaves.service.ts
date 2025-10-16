import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateLeaveDto } from './dto/create-leave.dto';

import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';

import { application_status, application_type } from '@prisma/client';



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



  async getLeaveTypes() {

    return this.prisma.leave_type.findMany();

  }


  getApplicationTypeOptions() {

    return Object.keys(application_type);

  }

}

