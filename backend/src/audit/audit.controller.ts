import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SYSTEM_PERMISSIONS } from '../roles/roles.service';

@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions(SYSTEM_PERMISSIONS.SYSTEM_SETTINGS)
  async findAll(
    @Query('user_id') userId?: string,
    @Query('action') action?: string,
    @Query('entity_type') entityType?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.auditService.findAll({
      user_id: userId ? parseInt(userId) : undefined,
      action,
      entity_type: entityType,
      start_date: startDate,
      end_date: endDate,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get('stats')
  @RequirePermissions(SYSTEM_PERMISSIONS.SYSTEM_SETTINGS)
  async getStats() {
    const stats = await this.auditService.getStats();
    return {
      success: true,
      data: stats,
    };
  }
}
