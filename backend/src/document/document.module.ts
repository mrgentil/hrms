import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesModule } from '../roles/roles.module';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Module({
  imports: [PrismaModule, RolesModule],
  controllers: [DocumentController],
  providers: [DocumentService, PermissionsGuard],
  exports: [DocumentService],
})
export class DocumentModule {}
