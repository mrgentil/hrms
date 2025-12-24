import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto, ContractStatus } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) { }

  async create(createContractDto: CreateContractDto, createdBy: number) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: createContractDto.user_id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return this.prisma.contract.create({
      data: {
        ...createContractDto,
        start_date: new Date(createContractDto.start_date),
        end_date: createContractDto.end_date ? new Date(createContractDto.end_date) : null,
        probation_end: createContractDto.probation_end ? new Date(createContractDto.probation_end) : null,
        created_by: createdBy,
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            work_email: true,
            position: { select: { title: true } },
            department_user_department_idTodepartment: { select: { department_name: true } },
          },
        },
      },
    });
  }

  async findAll(
    params?: {
      user_id?: number;
      status?: ContractStatus;
      contract_type?: string;
      expiring_soon?: boolean;
    },
    currentUser?: { id: number; role: UserRole }
  ) {
    const where: any = {};

    // Si l'utilisateur est un employé, il ne peut voir que ses propres contrats
    if (currentUser?.role === UserRole.ROLE_EMPLOYEE) {
      where.user_id = currentUser.id;
    } else if (params?.user_id) {
      // Les autres utilisateurs (RH, Admin) peuvent filtrer par user_id
      where.user_id = params.user_id;
    }

    if (params?.status) {
      where.status = params.status;
    }

    if (params?.contract_type) {
      where.contract_type = params.contract_type;
    }

    // Contrats expirant dans les 30 prochains jours
    if (params?.expiring_soon) {
      const today = new Date();
      const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      where.end_date = {
        gte: today,
        lte: in30Days,
      };
      where.status = 'ACTIVE';
    }

    return this.prisma.contract.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            work_email: true,
            profile_photo_url: true,
            position: { select: { title: true } },
            department_user_department_idTodepartment: { select: { department_name: true } },
          },
        },
        creator: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            work_email: true,
            profile_photo_url: true,
            hire_date: true,
            position: { select: { id: true, title: true } },
            department_user_department_idTodepartment: { select: { id: true, department_name: true } },
          },
        },
        creator: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contrat non trouvé');
    }

    return contract;
  }

  async findByUser(userId: number) {
    return this.prisma.contract.findMany({
      where: { user_id: userId },
      orderBy: { start_date: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
    });
  }

  async update(id: number, updateContractDto: UpdateContractDto) {
    const existing = await this.prisma.contract.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Contrat non trouvé');
    }

    const data: any = { ...updateContractDto };

    if (updateContractDto.start_date) {
      data.start_date = new Date(updateContractDto.start_date);
    }
    if (updateContractDto.end_date) {
      data.end_date = new Date(updateContractDto.end_date);
    }
    if (updateContractDto.probation_end) {
      data.probation_end = new Date(updateContractDto.probation_end);
    }

    return this.prisma.contract.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            work_email: true,
          },
        },
      },
    });
  }

  async terminate(id: number, notes?: string) {
    const existing = await this.prisma.contract.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Contrat non trouvé');
    }

    return this.prisma.contract.update({
      where: { id },
      data: {
        status: 'TERMINATED',
        notes: notes || existing.notes,
      },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.contract.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Contrat non trouvé');
    }

    return this.prisma.contract.delete({
      where: { id },
    });
  }

  // Statistiques des contrats
  async getStats() {
    const [total, byType, byStatus, expiringCount] = await Promise.all([
      this.prisma.contract.count(),
      this.prisma.contract.groupBy({
        by: ['contract_type'],
        _count: true,
      }),
      this.prisma.contract.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.contract.count({
        where: {
          status: 'ACTIVE',
          end_date: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      total,
      byType: byType.map(t => ({ type: t.contract_type, count: t._count })),
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
      expiringSoon: expiringCount,
    };
  }
}
