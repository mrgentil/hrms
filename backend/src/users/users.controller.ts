import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
  UploadedFile,
  UseInterceptors,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { QueryParamsDto } from './dto/query-params.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { UserRole } from '@prisma/client';
import { SYSTEM_PERMISSIONS } from '../roles/roles.service';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_CREATE)
  async create(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
    @CurrentUser() currentUser: any,
  ) {
    const user = await this.usersService.create(createUserDto, currentUser.id, currentUser.company_id);
    return {
      success: true,
      data: user,
      message: 'Utilisateur créé avec succès',
    };
  }

  @Get()
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async findAll(
    @Query(ValidationPipe) queryParams: QueryParamsDto,
    @CurrentUser() currentUser: any,
  ) {
    const result = await this.usersService.findAll(queryParams, currentUser.company_id);
    return {
      success: true,
      ...result,
    };
  }

  @Get('stats')
  async getStats() {
    const stats = await this.usersService.getStats();
    return {
      success: true,
      data: stats,
      message: 'Statistiques récupérées avec succès',
    };
  }

  @Get('search')
  async search(@Query('q') query: string) {
    const users = await this.usersService.search(query);
    return {
      success: true,
      data: users,
      message: 'Recherche effectuée avec succès',
    };
  }

  @Get('export')
  async export(
    @Query('format') format: 'csv' | 'xlsx' = 'csv',
    @Res() res: Response,
  ) {
    const buffer = await this.usersService.exportUsers(format);

    res.set({
      'Content-Type': format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="users.${format}"`,
    });

    res.send(buffer);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async import(@UploadedFile() file: any) {
    const result = await this.usersService.importUsers(file);
    return {
      success: true,
      data: result,
      message: 'Import terminé avec succès',
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);
    return {
      success: true,
      data: user,
      message: 'Utilisateur récupéré avec succès',
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: any,
  ) {
    const canManageOthers =
      currentUser.role === UserRole.ROLE_SUPER_ADMIN ||
      currentUser.role === UserRole.ROLE_ADMIN ||
      currentUser.role === UserRole.ROLE_MANAGER;

    if (!canManageOthers && currentUser.id !== id) {
      throw new ForbiddenException('Permissions insuffisantes');
    }

    const user = await this.usersService.update(id, updateUserDto);
    return {
      success: true,
      data: user,
      message: 'Utilisateur mis à jour avec succès',
    };
  }

  @Patch(':id/toggle-status')
  async toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    // Seuls les administrateurs autorisés peuvent activer/désactiver des utilisateurs
    if (
      currentUser.role !== UserRole.ROLE_SUPER_ADMIN &&
      currentUser.role !== UserRole.ROLE_ADMIN
    ) {
      throw new ForbiddenException('Permissions insuffisantes');
    }

    const user = await this.usersService.toggleStatus(id);
    return {
      success: true,
      data: user,
      message: 'Statut utilisateur mis à jour avec succès',
    };
  }

  @Put(':id/admin')
  async updateAdmin(
    @Param('id') id: string,
    @Body(ValidationPipe) updateUserAdminDto: UpdateUserAdminDto,
  ) {
    const updatedUser = await this.usersService.updateAdmin(+id, updateUserAdminDto);
    return {
      success: true,
      data: updatedUser,
      message: 'Utilisateur mis à jour avec succès',
    };
  }

  @Get('admin/options')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_CREATE)
  async getAdminOptions(@CurrentUser() currentUser: any) {
    const options = await this.usersService.getAdminOptions(currentUser.id);
    return {
      success: true,
      data: options,
    };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
