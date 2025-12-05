import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto, UpdateTagDto, AssignTagsDto } from './dto/create-tag.dto';

// Couleurs prédéfinies pour les tags
export const TAG_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#22C55E', // Green
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#0EA5E9', // Sky
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#D946EF', // Fuchsia
  '#EC4899', // Pink
  '#6B7280', // Gray
];

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTagDto) {
    // Vérifier si le tag existe déjà
    const existing = await this.prisma.tag.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Un tag avec ce nom existe déjà');
    }

    return this.prisma.tag.create({
      data: {
        name: dto.name,
        color: dto.color || TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)],
      },
    });
  }

  async findAll() {
    return this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            project_tags: true,
            task_tags: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        project_tags: {
          include: {
            project: { select: { id: true, name: true } },
          },
        },
        task_tags: {
          include: {
            task: { select: { id: true, title: true } },
          },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException('Tag non trouvé');
    }

    return tag;
  }

  async update(id: number, dto: UpdateTagDto) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new NotFoundException('Tag non trouvé');
    }

    // Vérifier si le nouveau nom n'est pas déjà utilisé
    if (dto.name && dto.name !== tag.name) {
      const existing = await this.prisma.tag.findUnique({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException('Un tag avec ce nom existe déjà');
      }
    }

    return this.prisma.tag.update({
      where: { id },
      data: {
        name: dto.name,
        color: dto.color,
      },
    });
  }

  async remove(id: number) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new NotFoundException('Tag non trouvé');
    }

    await this.prisma.tag.delete({ where: { id } });
    return { message: 'Tag supprimé avec succès' };
  }

  // Gestion des tags de projet
  async getProjectTags(projectId: number) {
    return this.prisma.project_tag.findMany({
      where: { project_id: projectId },
      include: {
        tag: true,
      },
    });
  }

  async setProjectTags(projectId: number, dto: AssignTagsDto) {
    // Supprimer les tags existants
    await this.prisma.project_tag.deleteMany({
      where: { project_id: projectId },
    });

    // Ajouter les nouveaux tags
    if (dto.tag_ids.length > 0) {
      await this.prisma.project_tag.createMany({
        data: dto.tag_ids.map(tagId => ({
          project_id: projectId,
          tag_id: tagId,
        })),
      });
    }

    return this.getProjectTags(projectId);
  }

  async addProjectTag(projectId: number, tagId: number) {
    const existing = await this.prisma.project_tag.findFirst({
      where: { project_id: projectId, tag_id: tagId },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.project_tag.create({
      data: {
        project_id: projectId,
        tag_id: tagId,
      },
      include: { tag: true },
    });
  }

  async removeProjectTag(projectId: number, tagId: number) {
    await this.prisma.project_tag.deleteMany({
      where: { project_id: projectId, tag_id: tagId },
    });
    return { message: 'Tag retiré du projet' };
  }

  // Gestion des tags de tâche
  async getTaskTags(taskId: number) {
    return this.prisma.task_tag.findMany({
      where: { task_id: taskId },
      include: {
        tag: true,
      },
    });
  }

  async setTaskTags(taskId: number, dto: AssignTagsDto) {
    // Supprimer les tags existants
    await this.prisma.task_tag.deleteMany({
      where: { task_id: taskId },
    });

    // Ajouter les nouveaux tags
    if (dto.tag_ids.length > 0) {
      await this.prisma.task_tag.createMany({
        data: dto.tag_ids.map(tagId => ({
          task_id: taskId,
          tag_id: tagId,
        })),
      });
    }

    return this.getTaskTags(taskId);
  }

  async addTaskTag(taskId: number, tagId: number) {
    const existing = await this.prisma.task_tag.findFirst({
      where: { task_id: taskId, tag_id: tagId },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.task_tag.create({
      data: {
        task_id: taskId,
        tag_id: tagId,
      },
      include: { tag: true },
    });
  }

  async removeTaskTag(taskId: number, tagId: number) {
    await this.prisma.task_tag.deleteMany({
      where: { task_id: taskId, tag_id: tagId },
    });
    return { message: 'Tag retiré de la tâche' };
  }

  // Recherche de tags
  async search(query: string) {
    return this.prisma.tag.findMany({
      where: {
        name: { contains: query },
      },
      take: 10,
      orderBy: { name: 'asc' },
    });
  }

  // Créer un tag ou le récupérer s'il existe
  async findOrCreate(name: string, color?: string) {
    const existing = await this.prisma.tag.findUnique({
      where: { name },
    });

    if (existing) {
      return existing;
    }

    return this.create({ name, color });
  }
}
