import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RecruitmentController } from './recruitment.controller';
import { RecruitmentService } from './recruitment.service';
import { ScoringService } from './scoring.service';
import { AiService } from './ai.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [PrismaModule, MailModule, ConfigModule],
    controllers: [RecruitmentController],
    providers: [RecruitmentService, ScoringService, AiService],
    exports: [RecruitmentService, ScoringService, AiService],
})
export class RecruitmentModule { }

