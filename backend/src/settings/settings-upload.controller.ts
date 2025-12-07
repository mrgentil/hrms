import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { Multer } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SYSTEM_PERMISSIONS } from '../roles/roles.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SettingsService } from './settings.service';

// Créer le dossier uploads s'il n'existe pas
const uploadPath = join(process.cwd(), '..', 'uploads', 'settings');
if (!existsSync(uploadPath)) {
  mkdirSync(uploadPath, { recursive: true });
}

@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SettingsUploadController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post('upload/:key')
  @RequirePermissions(SYSTEM_PERMISSIONS.SYSTEM_SETTINGS)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadPath,
        filename: (req, file, callback) => {
          const key = req.params.key;
          const uniqueSuffix = Date.now();
          const ext = extname(file.originalname);
          callback(null, `${key}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        // Accepter uniquement les images
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|svg\+xml|webp|x-icon|ico)$/)) {
          return callback(
            new BadRequestException('Seules les images sont autorisées'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
      },
    }),
  )
  async uploadSettingImage(
    @Param('key') key: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Construire l'URL du fichier
    const fileUrl = `/uploads/settings/${file.filename}`;

    // Mettre à jour le paramètre avec l'URL du fichier
    await this.settingsService.update(key, fileUrl, user.id);

    return {
      success: true,
      data: {
        key,
        url: fileUrl,
        filename: file.filename,
      },
    };
  }
}
