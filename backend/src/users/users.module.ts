import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesModule } from '../roles/roles.module';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, RolesModule, MailModule],
  controllers: [UsersController],
  providers: [UsersService, PermissionsGuard],
  exports: [UsersService],
})
export class UsersModule { }
