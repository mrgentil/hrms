import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlanningService {
  constructor(private readonly prisma: PrismaService) {}

  async getTeamSchedule(userId: number, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { manager_user_id: userId },
          { id: userId },
        ],
      },
      select: {
        id: true,
        full_name: true,
        profile_photo_url: true,
        position: {
          select: {
            title: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
        application: {
          where: {
            status: 'Approved',
            start_date: { lte: end },
            end_date: { gte: start },
          },
          select: {
            id: true,
            start_date: true,
            end_date: true,
            type: true,
            leave_type: {
              select: {
                name: true,
              }
            }
          }
        },
        attendance: {
          where: {
            date: {
              gte: start,
              lte: end,
            }
          },
          select: {
            id: true,
            date: true,
            status: true,
          }
        }
      }
    });

    return users.map(user => ({
      id: user.id,
      fullName: user.full_name,
      avatar: user.profile_photo_url,
      position: user.position?.title,
      department: user.department?.name,
      leaves: user.application.map(app => ({
        id: app.id,
        startDate: app.start_date,
        endDate: app.end_date,
        type: app.type,
        leaveTypeName: app.leave_type?.name,
      })),
      attendance: user.attendance,
    }));
  }
}
