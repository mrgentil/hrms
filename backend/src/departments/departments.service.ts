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
  constructor(private prisma: PrismaService) { }

  async create(companyId: number, createDepartmentDto: CreateDepartmentDto) {
    if (createDepartmentDto.manager_user_id) {
      const manager = await this.prisma.user.findUnique({
        where: { id: createDepartmentDto.manager_user_id },
      });
      if (!manager || manager.company_id !== companyId) {
        throw new BadRequestException('Utilisateur manager introuvable ou n\'appartient pas à votre entreprise');
      }
    }

    if (createDepartmentDto.parent_department_id) {
      const parent = await this.prisma.department.findUnique({
        where: { id: createDepartmentDto.parent_department_id },
      });
      // Verify parent belongs to company
      if (!parent || parent.company_id !== companyId) {
        throw new BadRequestException('Département parent introuvable');
      }
    }

    const existing = await this.prisma.department.findFirst({
      where: {
        company_id: companyId,
        name: createDepartmentDto.name,
        parent_department_id: createDepartmentDto.parent_department_id ?? null,
      },
    });

    if (existing) {
      throw new ConflictException('Un département avec ce nom existe déjà dans cette entreprise');
    }

    const department = await this.prisma.department.create({
      data: {
        company_id: companyId,
        name: createDepartmentDto.name,
        description: createDepartmentDto.description,
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

  async findAll(companyId: number, query: QueryDepartmentDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      company_id: companyId,
      is_active: true,
    };

    if (search) {
      where.name = { contains: search };
    }

    const [departments, total] = await Promise.all([
      this.prisma.department.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          user_department_manager_user_idTouser: {
            select: {
              id: true,
              full_name: true,
            },
          },
          _count: {
            select: {
              users: true,
            },
          },
        },
      }),
      this.prisma.department.count({ where }),
    ]);

    const mapped = departments.map((department) => {
      const { _count, ...rest } = department;
      return {
        ...rest,
        employees_count: _count.users,
      };
    });

    return {
      data: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(companyId: number, id: number) {
    const department = await this.prisma.department.findFirst({
      where: { id, company_id: companyId, is_active: true },
      include: {
        user_department_manager_user_idTouser: {
          select: {
            id: true,
            full_name: true,
          },
        },
        _count: {
          select: {
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
      employees_count: _count.user_user_department_idTodepartment,
    };
  }

  async update(companyId: number, id: number, updateDepartmentDto: UpdateDepartmentDto) {
    const department = await this.prisma.department.findFirst({
      where: { id, company_id: companyId },
    });

    if (!department) {
      throw new NotFoundException('Département non trouvé');
    }

    if (updateDepartmentDto.manager_user_id) {
      const manager = await this.prisma.user.findUnique({
        where: { id: updateDepartmentDto.manager_user_id },
      });
      if (!manager || manager.company_id !== companyId) {
        throw new BadRequestException('Utilisateur manager introuvable ou n\'appartient pas à votre entreprise');
      }
    }

    if (updateDepartmentDto.parent_department_id) {
      const parent = await this.prisma.department.findUnique({
        where: { id: updateDepartmentDto.parent_department_id },
      });
      if (!parent || parent.company_id !== companyId) {
        throw new BadRequestException('Département parent introuvable');
      }
      if (parent.id === id) {
        throw new BadRequestException('Un département ne peut pas être son propre parent');
      }
    }

    const newName = updateDepartmentDto.name; // DTO should support 'name'
    if (newName && newName !== department.name) {
      const duplicate = await this.prisma.department.findFirst({
        where: {
          company_id: companyId,
          id: { not: id },
          name: newName,
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

  async remove(companyId: number, id: number) {
    const department = await this.prisma.department.findFirst({
      where: { id, company_id: companyId },
      include: {
        _count: {
          select: {
            user_user_department_idTodepartment: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Département non trouvé');
    }

    if (department._count.users > 0) {
      throw new ConflictException('Impossible de supprimer un département qui possède des utilisateurs');
    }

    // Soft delete or Hard delete? Spec said "is_active" for soft delete, but task said "Désactiver (soft delete)".
    // So I should use is_active = false.
    await this.prisma.department.update({
      where: { id },
      data: { is_active: false }
    });

    return { message: 'Département supprimé (archivé) avec succès' };
  }
}
