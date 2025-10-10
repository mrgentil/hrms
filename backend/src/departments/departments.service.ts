import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { QueryDepartmentDto } from './dto/query-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    if (createDepartmentDto.manager_user_id) {
      const manager = await this.prisma.user.findUnique({
        where: { id: createDepartmentDto.manager_user_id },
      });
      if (!manager) {
        throw new BadRequestException('Utilisateur manager introuvable');
      }
    }

    if (createDepartmentDto.parent_department_id) {
      const parent = await this.prisma.department.findUnique({
        where: { id: createDepartmentDto.parent_department_id },
      });
      if (!parent) {
        throw new BadRequestException('Département parent introuvable');
      }
    }

    const existing = await this.prisma.department.findFirst({
      where: {
        department_name: createDepartmentDto.department_name,
        parent_department_id: createDepartmentDto.parent_department_id ?? null,
      },
    });

    if (existing) {
      throw new ConflictException('Un département avec ce nom existe déjà');
    }

    const department = await this.prisma.department.create({
      data: {
        department_name: createDepartmentDto.department_name,
        manager_user_id: createDepartmentDto.manager_user_id ?? null,
        parent_department_id: createDepartmentDto.parent_department_id ?? null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        user_department_manager_user_idTouser: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
    });

    return department;
  }

  async findAll(query: QueryDepartmentDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.department_name = { contains: search };
    }

    const [departments, total] = await Promise.all([
      this.prisma.department.findMany({
        where,
        skip,
        take: limit,
        orderBy: { department_name: 'asc' },
        include: {
          user_department_manager_user_idTouser: {
            select: {
              id: true,
              full_name: true,
            },
          },
          _count: {
            select: {
              position: true,
              user_user_department_idTodepartment: true,
            },
          },
        },
      }),
      this.prisma.department.count({ where }),
    ]);

    const mapped = departments.map(({ _count, ...rest }) => ({
      ...rest,
      positions_count: _count.position,
      employees_count: _count.user_user_department_idTodepartment,
    }));

    return {
      data: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        user_department_manager_user_idTouser: {
          select: {
            id: true,
            full_name: true,
          },
        },
        _count: {
          select: {
            position: true,
            user_user_department_idTodepartment: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Département non trouvé');
    }

    const { _count, ...rest } = department;

    return {
      ...rest,
      positions_count: _count.position,
      employees_count: _count.user_user_department_idTodepartment,
    };
  }

  async update(id: number, updateDepartmentDto: UpdateDepartmentDto) {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException('Département non trouvé');
    }

    if (updateDepartmentDto.manager_user_id) {
      const manager = await this.prisma.user.findUnique({
        where: { id: updateDepartmentDto.manager_user_id },
      });
      if (!manager) {
        throw new BadRequestException('Utilisateur manager introuvable');
      }
    }

    if (updateDepartmentDto.parent_department_id) {
      const parent = await this.prisma.department.findUnique({
        where: { id: updateDepartmentDto.parent_department_id },
      });
      if (!parent) {
        throw new BadRequestException('Département parent introuvable');
      }
      if (parent.id === id) {
        throw new BadRequestException('Un département ne peut pas être son propre parent');
      }
    }

    if (updateDepartmentDto.department_name && updateDepartmentDto.department_name !== department.department_name) {
      const duplicate = await this.prisma.department.findFirst({
        where: {
          id: { not: id },
          department_name: updateDepartmentDto.department_name,
          parent_department_id: updateDepartmentDto.parent_department_id ?? department.parent_department_id,
        },
      });
      if (duplicate) {
        throw new ConflictException('Un département avec ce nom existe déjà');
      }
    }

    const updated = await this.prisma.department.update({
      where: { id },
      data: {
        ...updateDepartmentDto,
        updated_at: new Date(),
      },
      include: {
        user_department_manager_user_idTouser: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
    });

    return updated;
  }

  async remove(id: number) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            position: true,
            user_user_department_idTodepartment: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Département non trouvé');
    }

    if (department._count.user_user_department_idTodepartment > 0) {
      throw new ConflictException('Impossible de supprimer un département qui possède des utilisateurs');
    }

    if (department._count.position > 0) {
      throw new ConflictException('Impossible de supprimer un département qui possède des postes');
    }

    await this.prisma.department.delete({ where: { id } });

    return { message: 'Département supprimé avec succès' };
  }
}
