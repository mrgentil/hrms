import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { QueryPositionDto } from './dto/query-position.dto';

@Injectable()
export class PositionsService {
  constructor(private prisma: PrismaService) { }

  async create(createPositionDto: CreatePositionDto) {
    const existing = await this.prisma.position.findFirst({
      where: {
        title: createPositionDto.title,
      },
    });

    if (existing) {
      throw new ConflictException('Un poste avec ce titre existe déjà');
    }

    const position = await this.prisma.position.create({
      data: {
        title: createPositionDto.title,
        level: createPositionDto.level,
        description: createPositionDto.description,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return position;
  }

  async findAll(query: QueryPositionDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

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

    if (
      updatePositionDto.title &&
      updatePositionDto.title !== existing.title
    ) {
      const duplicate = await this.prisma.position.findFirst({
        where: {
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
        // We handle department_id removal by ignoring it even if present in DTO in runtime (but Typescript might complain if we don't pick properties, however strict DTOs usually handle validation)
        // Safer to spread specific properties or assume DTO is clean. 
        // Let's assume DTO might still have it but we only pass relevant ones if mapped manually, or rely on DTO cleaning.
        // Here I'll just map manually or spread but 'department_id' should be removed from DTO type ideally too.
        // For now, let's just use ...updatePositionDto but usually prisma warns about unknown fields.
        // Wait, if DTO still has department_id, passing it to prisma update will throw.
        // I should strip it.    
        title: updatePositionDto.title,
        level: updatePositionDto.level,
        description: updatePositionDto.description,
        updated_at: new Date(),
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
