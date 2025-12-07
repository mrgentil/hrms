import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto, SendMessageDto, AddParticipantDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async createConversation(userId: number, dto: CreateConversationDto) {
    // Pour une conversation privée (2 personnes), vérifier si elle existe déjà
    if (!dto.is_group && dto.participant_ids.length === 1) {
      const existingConversation = await this.findPrivateConversation(
        userId,
        dto.participant_ids[0],
      );
      if (existingConversation) {
        return existingConversation;
      }
    }

    // Créer la conversation
    const conversation = await this.prisma.conversation.create({
      data: {
        name: dto.name,
        is_group: dto.is_group || dto.participant_ids.length > 1,
        created_by_user_id: userId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Ajouter le créateur comme participant
    await this.prisma.conversation_participant.create({
      data: {
        conversation_id: conversation.id,
        user_id: userId,
        joined_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Ajouter les autres participants
    for (const participantId of dto.participant_ids) {
      if (participantId !== userId) {
        await this.prisma.conversation_participant.create({
          data: {
            conversation_id: conversation.id,
            user_id: participantId,
            joined_at: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }
    }

    return this.getConversation(conversation.id, userId);
  }

  async findPrivateConversation(userId1: number, userId2: number) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        is_group: false,
        AND: [
          {
            conversation_participant: {
              some: { user_id: userId1 },
            },
          },
          {
            conversation_participant: {
              some: { user_id: userId2 },
            },
          },
        ],
      },
      include: {
        conversation_participant: true,
      },
    });

    // Trouver la conversation qui a exactement 2 participants
    return conversations.find(c => c.conversation_participant.length === 2);
  }

  async getConversations(userId: number) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        conversation_participant: {
          some: {
            user_id: userId,
            left_at: null,
          },
        },
      },
      include: {
        conversation_participant: {
          where: { left_at: null },
          include: {
            user: {
              select: {
                id: true,
                full_name: true,
                profile_photo_url: true,
                active: true,
              },
            },
          },
        },
        user_message: {
          orderBy: { created_at: 'desc' },
          take: 1,
          include: {
            user_user_message_sender_user_idTouser: {
              select: { id: true, full_name: true },
            },
          },
        },
      },
      orderBy: { updated_at: 'desc' },
    });

    return conversations.map(conv => ({
      ...conv,
      lastMessage: conv.user_message[0] || null,
      participants: conv.conversation_participant
        .filter(p => p.user_id !== userId)
        .map(p => p.user),
    }));
  }

  async getConversation(conversationId: number, userId: number) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        conversation_participant: {
          where: { left_at: null },
          include: {
            user: {
              select: {
                id: true,
                full_name: true,
                profile_photo_url: true,
                work_email: true,
                active: true,
              },
            },
          },
        },
        user: {
          select: { id: true, full_name: true },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvée');
    }

    // Vérifier que l'utilisateur est participant
    const isParticipant = conversation.conversation_participant.some(
      p => p.user_id === userId,
    );
    if (!isParticipant) {
      throw new ForbiddenException('Accès non autorisé à cette conversation');
    }

    return {
      ...conversation,
      participants: conversation.conversation_participant.map(p => p.user),
    };
  }

  async getMessages(conversationId: number, userId: number, limit = 50, offset = 0) {
    // Vérifier l'accès
    await this.getConversation(conversationId, userId);

    const messages = await this.prisma.user_message.findMany({
      where: { conversation_id: conversationId },
      include: {
        user_user_message_sender_user_idTouser: {
          select: {
            id: true,
            full_name: true,
            profile_photo_url: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    });

    return messages.reverse();
  }

  async sendMessage(userId: number, dto: SendMessageDto) {
    // Vérifier l'accès à la conversation
    await this.getConversation(dto.conversation_id, userId);

    const message = await this.prisma.user_message.create({
      data: {
        text: dto.content,
        conversation_id: dto.conversation_id,
        sender_user_id: userId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        user_user_message_sender_user_idTouser: {
          select: {
            id: true,
            full_name: true,
            profile_photo_url: true,
          },
        },
      },
    });

    // Mettre à jour la date de la conversation
    await this.prisma.conversation.update({
      where: { id: dto.conversation_id },
      data: { updated_at: new Date() },
    });

    return message;
  }

  async addParticipant(conversationId: number, userId: number, dto: AddParticipantDto) {
    const conversation = await this.getConversation(conversationId, userId);

    // Vérifier si l'utilisateur est déjà participant
    const existing = await this.prisma.conversation_participant.findFirst({
      where: {
        conversation_id: conversationId,
        user_id: dto.user_id,
        left_at: null,
      },
    });

    if (existing) {
      throw new ForbiddenException('Cet utilisateur est déjà dans la conversation');
    }

    return this.prisma.conversation_participant.create({
      data: {
        conversation_id: conversationId,
        user_id: dto.user_id,
        joined_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            profile_photo_url: true,
          },
        },
      },
    });
  }

  async leaveConversation(conversationId: number, userId: number) {
    await this.getConversation(conversationId, userId);

    await this.prisma.conversation_participant.updateMany({
      where: {
        conversation_id: conversationId,
        user_id: userId,
      },
      data: {
        left_at: new Date(),
        updated_at: new Date(),
      },
    });

    return { message: 'Vous avez quitté la conversation' };
  }

  async deleteMessage(messageId: number, userId: number) {
    const message = await this.prisma.user_message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message non trouvé');
    }

    if (message.sender_user_id !== userId) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres messages');
    }

    await this.prisma.user_message.delete({ where: { id: messageId } });
    return { message: 'Message supprimé' };
  }

  async searchUsers(query: string, userId: number) {
    return this.prisma.user.findMany({
      where: {
        id: { not: userId },
        active: true,
        OR: [
          { full_name: { contains: query } },
          { work_email: { contains: query } },
        ],
      },
      select: {
        id: true,
        full_name: true,
        profile_photo_url: true,
        work_email: true,
      },
      take: 10,
    });
  }
}
