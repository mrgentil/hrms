import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/create-permission.dto';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto/create-menu-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SYSTEM_PERMISSIONS } from '../roles/roles.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  // ============== PERMISSIONS ==============

  @Get()
  @RequirePermissions(SYSTEM_PERMISSIONS.ROLES_MANAGE)
  async findAllPermissions() {
    const permissions = await this.permissionsService.findAllPermissions();
    return { success: true, data: permissions };
  }

  @Get('grouped')
  @RequirePermissions(SYSTEM_PERMISSIONS.ROLES_MANAGE)
  async findPermissionsByGroup() {
    const groups = await this.permissionsService.findPermissionsByGroup();
    return { success: true, data: groups };
  }

  @Get('groups')
  @RequirePermissions(SYSTEM_PERMISSIONS.ROLES_MANAGE)
  async getPermissionGroups() {
    const groups = await this.permissionsService.getPermissionGroups();
    return { success: true, data: groups };
  }

  @Get(':id')
  @RequirePermissions(SYSTEM_PERMISSIONS.ROLES_MANAGE)
  async findOnePermission(@Param('id', ParseIntPipe) id: number) {
    const permission = await this.permissionsService.findOnePermission(id);
    return { success: true, data: permission };
  }

  @Post()
  @RequirePermissions(SYSTEM_PERMISSIONS.ROLES_MANAGE)
  async createPermission(@Body() dto: CreatePermissionDto) {
    const permission = await this.permissionsService.createPermission(dto);
    return { success: true, data: permission, message: 'Permission créée avec succès' };
  }

  @Patch(':id')
  @RequirePermissions(SYSTEM_PERMISSIONS.ROLES_MANAGE)
  async updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePermissionDto,
  ) {
    const permission = await this.permissionsService.updatePermission(id, dto);
    return { success: true, data: permission, message: 'Permission mise à jour' };
  }

  @Delete(':id')
  @RequirePermissions(SYSTEM_PERMISSIONS.ROLES_MANAGE)
  async deletePermission(@Param('id', ParseIntPipe) id: number) {
    await this.permissionsService.deletePermission(id);
    return { success: true, message: 'Permission supprimée' };
  }

  // ============== MENU ITEMS ==============

  @Get('menus/all')
  @RequirePermissions(SYSTEM_PERMISSIONS.ROLES_MANAGE)
  async findAllMenuItems() {
    const menus = await this.permissionsService.findAllMenuItems();
    return { success: true, data: menus };
  }

  @Get('menus/user')
  async findMenuItemsForUser(@CurrentUser() user: any) {
    // Récupérer les permissions de l'utilisateur depuis le token/session
    const userPermissions = user.permissions || [];
    const menus = await this.permissionsService.findMenuItemsForUser(userPermissions);
    return { success: true, data: menus };
  }

  @Get('menus/:id')
  @RequirePermissions(SYSTEM_PERMISSIONS.ROLES_MANAGE)
  async findOneMenuItem(@Param('id', ParseIntPipe) id: number) {
    const menu = await this.permissionsService.findOneMenuItem(id);
    return { success: true, data: menu };
  }

  @Post('menus')
  @RequirePermissions(SYSTEM_PERMISSIONS.ROLES_MANAGE)
  async createMenuItem(@Body() dto: CreateMenuItemDto) {
    const menu = await this.permissionsService.createMenuItem(dto);
    return { success: true, data: menu, message: 'Menu créé avec succès' };
  }

  @Patch('menus/:id')
  @RequirePermissions(SYSTEM_PERMISSIONS.ROLES_MANAGE)
  async updateMenuItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMenuItemDto,
  ) {
    const menu = await this.permissionsService.updateMenuItem(id, dto);
    return { success: true, data: menu, message: 'Menu mis à jour' };
  }

  @Delete('menus/:id')
  @RequirePermissions(SYSTEM_PERMISSIONS.ROLES_MANAGE)
  async deleteMenuItem(@Param('id', ParseIntPipe) id: number) {
    await this.permissionsService.deleteMenuItem(id);
    return { success: true, message: 'Menu supprimé' };
  }

  @Post('menus/reorder')
  @RequirePermissions(SYSTEM_PERMISSIONS.ROLES_MANAGE)
  async reorderMenuItems(
    @Body() items: { id: number; sort_order: number; parent_id?: number | null }[],
  ) {
    await this.permissionsService.reorderMenuItems(items);
    return { success: true, message: 'Ordre mis à jour' };
  }

  // ============== SEED ==============

  @Post('seed')
  @RequirePermissions(SYSTEM_PERMISSIONS.ROLES_MANAGE)
  async seedDefaultPermissions() {
    const result = await this.permissionsService.seedDefaultPermissionsAndMenus();
    return result;
  }
}
