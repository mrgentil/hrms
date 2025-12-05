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
import { MessagesService } from './messages.service';
import { CreateConversationDto, SendMessageDto, AddParticipantDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('conversations')
  async createConversation(
    @CurrentUser() user: any,
    @Body(ValidationPipe) dto: CreateConversationDto,
  ) {
    const conversation = await this.messagesService.createConversation(user.id, dto);
    return {
      success: true,
      data: conversation,
      message: 'Conversation créée',
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
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const messages = await this.messagesService.getMessages(
      id,
      user.id,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
    return {
      success: true,
      data: messages,
    };
  }

  @Post('send')
  async sendMessage(
    @CurrentUser() user: any,
    @Body(ValidationPipe) dto: SendMessageDto,
  ) {
    const message = await this.messagesService.sendMessage(user.id, dto);
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
