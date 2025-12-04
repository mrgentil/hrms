import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { SYSTEM_PERMISSIONS } from '../roles/roles.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // Endpoint public - pas besoin d'authentification
  @Get('public')
  @Public()
  async getPublicSettings() {
    const settings = await this.settingsService.findPublic();
    return { success: true, data: settings };
  }

  // Initialiser les paramètres par défaut
  @Post('initialize')
  @RequirePermissions(SYSTEM_PERMISSIONS.SYSTEM_SETTINGS)
  async initialize() {
    const results = await this.settingsService.initializeDefaults();
    return { success: true, data: results };
  }

  // Obtenir tous les paramètres
  @Get()
  @RequirePermissions(SYSTEM_PERMISSIONS.SYSTEM_SETTINGS)
  async findAll(@Query('category') category?: string) {
    const settings = await this.settingsService.findAll(category);
    return { success: true, data: settings };
  }

  // Obtenir les catégories
  @Get('categories')
  @RequirePermissions(SYSTEM_PERMISSIONS.SYSTEM_SETTINGS)
  async getCategories() {
    const categories = await this.settingsService.getCategories();
    return { success: true, data: categories };
  }

  // Obtenir un paramètre par clé
  @Get(':key')
  @RequirePermissions(SYSTEM_PERMISSIONS.SYSTEM_SETTINGS)
  async findByKey(@Param('key') key: string) {
    const setting = await this.settingsService.findByKey(key);
    return { success: true, data: setting };
  }

  // Mettre à jour un paramètre
  @Patch(':key')
  @RequirePermissions(SYSTEM_PERMISSIONS.SYSTEM_SETTINGS)
  async update(
    @Param('key') key: string,
    @Body('value') value: string | null,
    @CurrentUser() user: any,
  ) {
    const setting = await this.settingsService.update(key, value, user.id);
    return { success: true, data: setting };
  }

  // Mettre à jour plusieurs paramètres
  @Patch()
  @RequirePermissions(SYSTEM_PERMISSIONS.SYSTEM_SETTINGS)
  async updateMany(
    @Body('settings') settings: { key: string; value: string | null }[],
    @CurrentUser() user: any,
  ) {
    const results = await this.settingsService.updateMany(settings, user.id);
    return { success: true, data: results };
  }

  // Créer un paramètre personnalisé
  @Post()
  @RequirePermissions(SYSTEM_PERMISSIONS.SYSTEM_SETTINGS)
  async create(
    @Body() data: {
      key: string;
      value?: string;
      type?: string;
      category?: string;
      label: string;
      description?: string;
      is_public?: boolean;
    },
    @CurrentUser() user: any,
  ) {
    const setting = await this.settingsService.create(data, user.id);
    return { success: true, data: setting };
  }

  // Supprimer un paramètre personnalisé
  @Delete(':key')
  @RequirePermissions(SYSTEM_PERMISSIONS.SYSTEM_SETTINGS)
  async delete(@Param('key') key: string) {
    await this.settingsService.delete(key);
    return { success: true, message: 'Paramètre supprimé' };
  }
}
