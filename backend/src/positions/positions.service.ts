import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { QueryPositionDto } from './dto/query-position.dto';

@Injectable()
export class PositionsService {
  constructor(private prisma: PrismaService) {}

  async create(createPositionDto: CreatePositionDto) {
    if (createPositionDto.department_id) {
      const department = await this.prisma.department.findUnique({
        where: { id: createPositionDto.department_id },
      });

      if (!department) {
        throw new BadRequestException('Département non trouvé');
      }
    }

    const existing = await this.prisma.position.findFirst({
      where: {
        title: createPositionDto.title,
        department_id: createPositionDto.department_id ?? undefined,
      },
    });

    if (existing) {
      throw new ConflictException('Un poste avec ce titre existe déjà pour ce département');
    }

    const position = await this.prisma.position.create({
      data: {
        title: createPositionDto.title,
        level: createPositionDto.level,
        description: createPositionDto.description,
        department_id: createPositionDto.department_id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        department: {
          select: {
            id: true,
            department_name: true,
          },
        },
      },
    });

    return position;
  }

  async findAll(query: QueryPositionDto) {
    const { page = 1, limit = 10, search, department_id } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { level: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (department_id) {
      where.department_id = department_id;
    }

    const [positions, total] = await Promise.all([
      this.prisma.position.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          department: {
            select: {
              id: true,
              department_name: true,
            },
          },
          _count: {
            select: {
              user: true,
            },
          },
        },
      }),
      this.prisma.position.count({ where }),
    ]);

    const mapped = positions.map(({ _count, ...rest }) => ({
      ...rest,
      employees_count: _count.user,
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
    const position = await this.prisma.position.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            department_name: true,
          },
        },
        _count: {
          select: {
            user: true,
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
      employees_count: _count.user,
    };
  }

  async update(id: number, updatePositionDto: UpdatePositionDto) {
    const existing = await this.prisma.position.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Poste non trouvé');
    }

    if (updatePositionDto.department_id) {
      const department = await this.prisma.department.findUnique({
        where: { id: updatePositionDto.department_id },
      });

      if (!department) {
        throw new BadRequestException('Département non trouvé');
      }
    }

    if (
      updatePositionDto.title &&
      (updatePositionDto.title !== existing.title ||
        (updatePositionDto.department_id ?? existing.department_id) !== existing.department_id)
    ) {
      const duplicate = await this.prisma.position.findFirst({
        where: {
          id: { not: id },
          title: updatePositionDto.title,
          department_id: updatePositionDto.department_id ?? existing.department_id,
        },
      });

      if (duplicate) {
        throw new ConflictException('Un poste avec ce titre existe déjà pour ce département');
      }
    }

    const updated = await this.prisma.position.update({
      where: { id },
      data: {
        ...updatePositionDto,
        updated_at: new Date(),
      },
      include: {
        department: {
          select: {
            id: true,
            department_name: true,
          },
        },
      },
    });

    return updated;
  }

  async remove(id: number) {
    const position = await this.prisma.position.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            user: true,
          },
        },
      },
    });

    if (!position) {
      throw new NotFoundException('Poste non trouvé');
    }

    if (position._count.user > 0) {
      throw new ConflictException('Impossible de supprimer un poste assigné à des utilisateurs');
    }

    await this.prisma.position.delete({ where: { id } });

    return { message: 'Poste supprimé avec succès' };
  }
}
