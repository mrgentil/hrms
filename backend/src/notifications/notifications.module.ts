import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway';
import { PresenceService } from '../common/gateways/presence.service';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway, PresenceService],
  exports: [NotificationsService, PresenceService],
})
export class NotificationsModule { }
