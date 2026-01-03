import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { QueryPositionDto } from './dto/query-position.dto';

@Injectable()
export class PositionsService {
  constructor(private prisma: PrismaService) { }

  async create(companyId: number, createPositionDto: CreatePositionDto) {
    // Check if department belongs to company
    if (createPositionDto.department_id) {
      const department = await this.prisma.department.findUnique({
        where: { id: createPositionDto.department_id },
      });
      if (!department || department.company_id !== companyId) {
        throw new BadRequestException('Département introuvable ou n\'appartient pas à votre entreprise');
      }
    }

    const existing = await this.prisma.position.findFirst({
      where: {
        company_id: companyId,
        title: createPositionDto.title,
      },
    });

    if (existing) {
      throw new ConflictException('Un poste avec ce titre existe déjà dans cette entreprise');
    }

    const position = await this.prisma.position.create({
      data: {
        company_id: companyId,
        title: createPositionDto.title,
        level: createPositionDto.level,
        description: createPositionDto.description,
        department_id: createPositionDto.department_id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return position;
  }

  async findAll(companyId: number, query: QueryPositionDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      company_id: companyId,
      is_active: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { level: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [positions, total] = await Promise.all([
      this.prisma.position.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          department: {
            select: { id: true, name: true }
          },
          _count: {
            select: {
              users: true,
            },
          },
        },
      }),
      this.prisma.position.count({ where }),
    ]);

    const mapped = positions.map(({ _count, ...rest }) => ({
      ...rest,
      employees_count: _count.users,
    }));

    return {
      data: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(companyId: number, id: number) {
    const position = await this.prisma.position.findFirst({
      where: { id, company_id: companyId, is_active: true },
      include: {
        department: {
          select: { id: true, name: true }
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!position) {
      throw new NotFoundException('Poste non trouvé');
    }

    const { _count, ...rest } = position;

    return {
      ...rest,
      employees_count: _count.users,
    };
  }

  async update(companyId: number, id: number, updatePositionDto: UpdatePositionDto) {
    const existing = await this.prisma.position.findFirst({
      where: { id, company_id: companyId },
    });

    if (!existing) {
      throw new NotFoundException('Poste non trouvé');
    }

    if (updatePositionDto.department_id) {
      const department = await this.prisma.department.findUnique({
        where: { id: updatePositionDto.department_id },
      });
      if (!department || department.company_id !== companyId) {
        throw new BadRequestException('Département introuvable ou n\'appartient pas à votre entreprise');
      }
    }

    if (
      updatePositionDto.title &&
      updatePositionDto.title !== existing.title
    ) {
      const duplicate = await this.prisma.position.findFirst({
        where: {
          company_id: companyId,
          id: { not: id },
          title: updatePositionDto.title,
        },
      });

      if (duplicate) {
        throw new ConflictException('Un poste avec ce titre existe déjà');
      }
    }

    const updated = await this.prisma.position.update({
      where: { id },
      data: {
        title: updatePositionDto.title,
        level: updatePositionDto.level,
        description: updatePositionDto.description,
        department_id: updatePositionDto.department_id,
        updated_at: new Date(),
      },
    });

    return updated;
  }

  async remove(companyId: number, id: number) {
    const position = await this.prisma.position.findFirst({
      where: { id, company_id: companyId },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!position) {
      throw new NotFoundException('Poste non trouvé');
    }

    if (position._count.users > 0) {
      throw new ConflictException('Impossible de supprimer un poste assigné à des utilisateurs');
    }

    // Soft delete
    await this.prisma.position.update({
      where: { id },
      data: { is_active: false }
    });

    return { message: 'Poste supprimé (archivé) avec succès' };
  }
}
