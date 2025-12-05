import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { MarkAsReadDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
  ) {
    const notifications = await this.notificationsService.findAllForUser(
      user.id,
      limit ? parseInt(limit, 10) : 50,
    );
    return {
      success: true,
      data: notifications,
    };
  }

  @Get('unread')
  async findUnread(@CurrentUser() user: any) {
    const notifications = await this.notificationsService.findUnreadForUser(user.id);
    return {
      success: true,
      data: notifications,
    };
  }

  @Get('count')
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return {
      success: true,
      data: { count },
    };
  }

  @Post('mark-read')
  async markAsRead(
    @CurrentUser() user: any,
    @Body(ValidationPipe) dto: MarkAsReadDto,
  ) {
    if (dto.mark_all) {
      const result = await this.notificationsService.markAllAsRead(user.id);
      return {
        success: true,
        data: result,
        message: 'Toutes les notifications marquées comme lues',
      };
    }

    const result = await this.notificationsService.markAsRead(user.id, dto.notification_ids);
    return {
      success: true,
      data: result,
      message: 'Notifications marquées comme lues',
    };
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.notificationsService.delete(user.id, id);
    return {
      success: true,
      message: 'Notification supprimée',
    };
  }

  @Delete()
  async deleteAll(@CurrentUser() user: any) {
    await this.notificationsService.deleteAll(user.id);
    return {
      success: true,
      message: 'Toutes les notifications supprimées',
    };
  }
}
