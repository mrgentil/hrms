import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';

// Services
import {
  CampaignsService,
  ReviewsService,
  ObjectivesService,
  FeedbackService,
  ImprovementPlansService,
  RecognitionService,
} from './services';

// Controllers
import {
  CampaignsController,
  ReviewsController,
  ObjectivesController,
  FeedbackController,
  ImprovementPlansController,
  RecognitionController,
} from './controllers';

@Module({
  imports: [PrismaModule, NotificationsModule, MailModule],
  controllers: [
    CampaignsController,
    ReviewsController,
    ObjectivesController,
    FeedbackController,
    ImprovementPlansController,
    RecognitionController,
  ],
  providers: [
    CampaignsService,
    ReviewsService,
    ObjectivesService,
    FeedbackService,
    ImprovementPlansService,
    RecognitionService,
  ],
  exports: [
    CampaignsService,
    ReviewsService,
    ObjectivesService,
    FeedbackService,
    ImprovementPlansService,
    RecognitionService,
  ],
})
export class PerformanceModule { }
