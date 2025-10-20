import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly documentInclude = {
    user_user_document_uploaded_by_user_idTouser: {
      select: { id: true, full_name: true },
    },
    user_user_document_user_idTouser: {
      select: { id: true, full_name: true },
    },
  };

  async create(currentUserId: number, createDocumentDto: CreateDocumentDto) {
    if (!createDocumentDto.file_path) {
      throw new BadRequestException('Le fichier du document est requis');
    }

    const owner = await this.prisma.user.findUnique({
      where: { id: createDocumentDto.user_id },
    });

    if (!owner) {
      throw new NotFoundException('Utilisateur cible introuvable');
    }

    return this.prisma.user_document.create({
      data: {
        user_id: createDocumentDto.user_id,
        uploaded_by_user_id: currentUserId,
        name: createDocumentDto.name,
        document_type: createDocumentDto.document_type,
        file_path: createDocumentDto.file_path,
        is_confidential: createDocumentDto.is_confidential ?? false,
        description: createDocumentDto.description,
        expires_at: createDocumentDto.expires_at
          ? new Date(createDocumentDto.expires_at)
          : null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: this.documentInclude,
    });
  }

  async findAll() {
    return this.prisma.user_document.findMany({
      include: this.documentInclude,
      orderBy: { created_at: 'desc' },
    });
  }

  async findByUser(userId: number) {
    return this.prisma.user_document.findMany({
      where: { user_id: userId },
      include: this.documentInclude,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const document = await this.prisma.user_document.findUnique({
      where: { id },
      include: this.documentInclude,
    });

    if (!document) {
      throw new NotFoundException('Document introuvable');
    }

    return document;
  }

  async update(id: number, updateDocumentDto: UpdateDocumentDto) {
    const existing = await this.prisma.user_document.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Document introuvable');
    }

    if (
      updateDocumentDto.user_id !== undefined &&
      updateDocumentDto.user_id !== existing.user_id
    ) {
      const owner = await this.prisma.user.findUnique({
        where: { id: updateDocumentDto.user_id },
      });

      if (!owner) {
        throw new NotFoundException('Utilisateur cible introuvable');
      }
    }

    const data: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (updateDocumentDto.name !== undefined) {
      data.name = updateDocumentDto.name;
    }

    if (updateDocumentDto.document_type !== undefined) {
      data.document_type = updateDocumentDto.document_type;
    }

    if (updateDocumentDto.file_path !== undefined) {
      data.file_path = updateDocumentDto.file_path;
    }

    if (updateDocumentDto.is_confidential !== undefined) {
      data.is_confidential = updateDocumentDto.is_confidential;
    }

    if (updateDocumentDto.description !== undefined) {
      data.description = updateDocumentDto.description;
    }

    if (updateDocumentDto.expires_at !== undefined) {
      data.expires_at = updateDocumentDto.expires_at
        ? new Date(updateDocumentDto.expires_at)
        : null;
    }

    if (updateDocumentDto.user_id !== undefined) {
      data.user_id = updateDocumentDto.user_id;
    }

    return this.prisma.user_document.update({
      where: { id },
      data,
      include: this.documentInclude,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.user_document.delete({
      where: { id },
    });

    return { message: 'Document supprime avec succes' };
  }
}
