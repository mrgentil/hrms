import { Module, forwardRef } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskFeaturesController } from './task-features.controller';
import { TaskFeaturesService } from './task-features.service';
import { TaskRemindersService } from './task-reminders.service';
import { TaskExportService } from './task-export.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    PrismaModule, 
    forwardRef(() => NotificationsModule),
    MailModule,
    MulterModule.register({
      dest: './uploads/tasks',
    }),
  ],
  controllers: [TasksController, TaskFeaturesController],
  providers: [TasksService, TaskFeaturesService, TaskRemindersService, TaskExportService],
  exports: [TasksService, TaskFeaturesService, TaskRemindersService, TaskExportService],
})
export class TasksModule {}
