import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { SettingsUploadController } from './settings-upload.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    PrismaModule, 
    RolesModule,
    MulterModule.register({
      dest: '../uploads/settings',
    }),
  ],
  controllers: [SettingsController, SettingsUploadController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
