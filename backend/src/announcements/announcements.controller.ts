import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SYSTEM_PERMISSIONS } from '../roles/roles.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('announcements')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @RequirePermissions(SYSTEM_PERMISSIONS.ANNOUNCEMENTS_MANAGE)
  create(
    @Body() createAnnouncementDto: CreateAnnouncementDto,
    @CurrentUser() user: any,
  ) {
    return this.announcementsService.create(createAnnouncementDto, user.id);
  }

  @Get()
  @RequirePermissions(SYSTEM_PERMISSIONS.ANNOUNCEMENTS_VIEW)
  findAll(
    @Query('is_published') isPublished?: string,
    @Query('type') type?: string,
    @Query('department_id') departmentId?: string,
    @Query('include_expired') includeExpired?: string,
  ) {
    return this.announcementsService.findAll({
      is_published: isPublished === 'true' ? true : isPublished === 'false' ? false : undefined,
      type,
      department_id: departmentId ? parseInt(departmentId) : undefined,
      include_expired: includeExpired === 'true',
    });
  }

  @Get('my')
  @RequirePermissions(SYSTEM_PERMISSIONS.ANNOUNCEMENTS_VIEW)
  findMyAnnouncements(@CurrentUser() user: any) {
    return this.announcementsService.findPublishedForUser(
      user.id,
      user.department_id,
    );
  }

  @Get('stats')
  @RequirePermissions(SYSTEM_PERMISSIONS.ANNOUNCEMENTS_VIEW)
  getStats() {
    return this.announcementsService.getStats();
  }

  @Get(':id')
  @RequirePermissions(SYSTEM_PERMISSIONS.ANNOUNCEMENTS_VIEW)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.announcementsService.findOne(id);
  }

  @Get(':id/readers')
  @RequirePermissions(SYSTEM_PERMISSIONS.ANNOUNCEMENTS_MANAGE)
  getReaders(@Param('id', ParseIntPipe) id: number) {
    return this.announcementsService.getReaders(id);
  }

  @Patch(':id')
  @RequirePermissions(SYSTEM_PERMISSIONS.ANNOUNCEMENTS_MANAGE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.update(id, updateAnnouncementDto);
  }

  @Patch(':id/publish')
  @RequirePermissions(SYSTEM_PERMISSIONS.ANNOUNCEMENTS_MANAGE)
  publish(@Param('id', ParseIntPipe) id: number) {
    return this.announcementsService.publish(id);
  }

  @Patch(':id/unpublish')
  @RequirePermissions(SYSTEM_PERMISSIONS.ANNOUNCEMENTS_MANAGE)
  unpublish(@Param('id', ParseIntPipe) id: number) {
    return this.announcementsService.unpublish(id);
  }

  @Post(':id/read')
  @RequirePermissions(SYSTEM_PERMISSIONS.ANNOUNCEMENTS_VIEW)
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.announcementsService.markAsRead(id, user.id);
  }

  @Delete(':id')
  @RequirePermissions(SYSTEM_PERMISSIONS.ANNOUNCEMENTS_MANAGE)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.announcementsService.remove(id);
  }
}
