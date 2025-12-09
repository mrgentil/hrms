import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskFeaturesController } from './task-features.controller';
import { TaskFeaturesService } from './task-features.service';
import { TaskRemindersService } from './task-reminders.service';
import { TaskExportService } from './task-export.service';
import { TaskRecurrenceService } from './task-recurrence.service';
import { FileDownloadController } from './file-download.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    PrismaModule, 
    ConfigModule,
    forwardRef(() => NotificationsModule),
    MailModule,
    MulterModule.register({
      dest: './uploads/tasks',
    }),
  ],
  controllers: [TasksController, TaskFeaturesController, FileDownloadController],
  providers: [TasksService, TaskFeaturesService, TaskRemindersService, TaskExportService, TaskRecurrenceService],
  exports: [TasksService, TaskFeaturesService, TaskRemindersService, TaskExportService, TaskRecurrenceService],
})
export class TasksModule {}
