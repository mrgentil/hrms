import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { MessagesGateway } from './messages.gateway';

import { MessagesService } from './messages.service';
import { CreateConversationDto, SendMessageDto, AddParticipantDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import type { Express } from 'express';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly messagesGateway: MessagesGateway,
  ) { }

  @Post('conversations')
  async createConversation(
    @CurrentUser() user: any,
    @Body(ValidationPipe) dto: CreateConversationDto,
  ) {
    const conversation = await this.messagesService.createConversation(user.id, dto);
    return {
      success: true,
      data: conversation,
    };
  }

  @Get('conversations')
  async getConversations(@CurrentUser() user: any) {
    const conversations = await this.messagesService.getConversations(user.id);
    return {
      success: true,
      data: conversations,
    };
  }

  @Get('conversations/:id')
  async getConversation(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const conversation = await this.messagesService.getConversation(id, user.id);
    return {
      success: true,
      data: conversation,
    };
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    const messages = await this.messagesService.getMessages(id, user.id, limit, offset);
    return {
      success: true,
      data: messages,
    };
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: any) {
    const result = await this.messagesService.getUnreadCount(user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Post('send')
  @UseInterceptors(FileInterceptor('file'))
  async sendMessage(
    @CurrentUser() user: any,
    @Body() dto: SendMessageDto, // ValidationPipe might be tricky with FormData, ensure DTO handles string transformation if needed
    @UploadedFile() file: Express.Multer.File,
  ) {
    const message = await this.messagesService.sendMessage(user.id, dto, file);

    // Emettre l'événement temps réel via le gateway
    // Emettre à la room de la conversation (pour ceux qui l'ont ouverte)
    this.messagesGateway.server.to(`conversation_${dto.conversation_id}`).emit('newMessage', message);

    // Notifier CHAQUE participant via sa room personnelle
    if (message.conversationParticipants) {
      message.conversationParticipants.forEach((pId: number) => {
        this.messagesGateway.server.to(`user_${pId}`).emit('newMessage', message);
      });
    }

    return {
      success: true,
      data: message,
      message: 'Message envoyé',
    };
  }

  @Post('conversations/:id/participants')
  async addParticipant(
    @Param('id', ParseIntPipe) conversationId: number,
    @CurrentUser() user: any,
    @Body(ValidationPipe) dto: AddParticipantDto,
  ) {
    const participant = await this.messagesService.addParticipant(
      conversationId,
      user.id,
      dto,
    );
    return {
      success: true,
      data: participant,
      message: 'Participant ajouté',
    };
  }

  @Post('conversations/:id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const result = await this.messagesService.markAsRead(id, user.id);
    return {
      success: true,
      ...result,
    };
  }

  @Delete('conversations/:id/leave')
  async leaveConversation(
    @Param('id', ParseIntPipe) conversationId: number,
    @CurrentUser() user: any,
  ) {
    const result = await this.messagesService.leaveConversation(conversationId, user.id);
    return {
      success: true,
      ...result,
    };
  }

  @Delete(':id')
  async deleteMessage(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const result = await this.messagesService.deleteMessage(id, user.id);
    return {
      success: true,
      ...result,
    };
  }

  @Get('users/search')
  async searchUsers(
    @Query('q') query: string,
    @CurrentUser() user: any,
  ) {
    const users = await this.messagesService.searchUsers(query || '', user.id);
    return {
      success: true,
      data: users,
    };
  }
}
