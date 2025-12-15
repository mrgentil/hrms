import { Module } from '@nestjs/common';
import { RecruitmentController } from './recruitment.controller';
import { RecruitmentService } from './recruitment.service';
import { ScoringService } from './scoring.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [PrismaModule, MailModule],
    controllers: [RecruitmentController],
    providers: [RecruitmentService, ScoringService],
    exports: [RecruitmentService, ScoringService],
})
export class RecruitmentModule { }

