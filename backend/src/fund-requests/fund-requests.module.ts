import { Module } from '@nestjs/common';
import { FundRequestsController } from './fund-requests.controller';
import { FundRequestsService } from './fund-requests.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesModule } from '../roles/roles.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [PrismaModule, RolesModule, NotificationsModule, MailModule],
    controllers: [FundRequestsController],
    providers: [FundRequestsService],
    exports: [FundRequestsService],
})
export class FundRequestsModule { }
