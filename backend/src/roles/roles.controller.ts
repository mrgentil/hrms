import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { RolesService, SYSTEM_PERMISSIONS } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequirePermissions(SYSTEM_PERMISSIONS.ROLES_MANAGE)
  async create(
    @Body(ValidationPipe) createRoleDto: CreateRoleDto,
    @CurrentUser() user: any,
  ) {
    const role = await this.rolesService.create(createRoleDto);
    return {
      success: true,
      data: role,
      message: 'Rôle créé avec succès',
    };
  }

  @Get()
  async findAll() {
    const roles = await this.rolesService.findAll();
    return {
      success: true,
      data: roles,
    };
  }

  @Get('permissions')
  async getAvailablePermissions() {
    const permissions = await this.rolesService.getAvailablePermissions();
    return {
      success: true,
      data: permissions,
    };
  }

  @Post('initialize')
  @RequirePermissions(SYSTEM_PERMISSIONS.PERMISSIONS_MANAGE)
  async initializePredefinedRoles(@CurrentUser() user: any) {
    const results = await this.rolesService.initializePredefinedRoles();
    return {
      success: true,
      data: results,
      message: 'Rôles prédéfinis initialisés',
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const role = await this.rolesService.findOne(id);
    return {
      success: true,
      data: role,
    };
  }

  @Patch(':id')
  @RequirePermissions(SYSTEM_PERMISSIONS.ROLES_MANAGE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateRoleDto: UpdateRoleDto,
    @CurrentUser() user: any,
  ) {
    const role = await this.rolesService.update(id, updateRoleDto);
    return {
      success: true,
      data: role,
      message: 'Rôle mis à jour avec succès',
    };
  }

  @Delete(':id')
  @RequirePermissions(SYSTEM_PERMISSIONS.ROLES_MANAGE)
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    const result = await this.rolesService.remove(id);
    return {
      success: true,
      message: result.message,
    };
  }

  @Get('user/:userId/permissions')
  async getUserPermissions(@Param('userId', ParseIntPipe) userId: number) {
    const permissions = await this.rolesService.getUserPermissions(userId);
    return {
      success: true,
      data: permissions,
    };
  }

  @Post('assign')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_MANAGE_ROLES)
  async assignRoleToUser(
    @Body() body: { userId: number; roleId: number },
    @CurrentUser() user: any,
  ) {
    const updatedUser = await this.rolesService.assignRoleToUser(body.userId, body.roleId);
    return {
      success: true,
      data: updatedUser,
      message: 'Rôle assigné avec succès',
    };
  }
}
