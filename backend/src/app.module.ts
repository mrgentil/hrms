import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { resolve } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PositionsModule } from './positions/positions.module';
import { DepartmentsModule } from './departments/departments.module';
import { EmployeesModule } from './employees/employees.module';
import { LeavesModule } from './leaves/leaves.module';
import { DocumentModule } from './document/document.module';
import { MailModule } from './mail/mail.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ExpensesModule } from './expenses/expenses.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ContractsModule } from './contracts/contracts.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { SettingsModule } from './settings/settings.module';
import { AuditModule } from './audit/audit.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { MessagesModule } from './messages/messages.module';
import { TagsModule } from './tags/tags.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdvancesModule } from './advances/advances.module';
import { BonusesModule } from './bonuses/bonuses.module';
import { BenefitsModule } from './benefits/benefits.module';
import { PayslipsModule } from './payslips/payslips.module';
import { RecruitmentModule } from './recruitment/recruitment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(__dirname, '..', '..', '.env'),
        resolve(process.cwd(), '..', '.env'),
        '.env',
      ],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PositionsModule,
    DepartmentsModule,
    EmployeesModule,
    LeavesModule,
    DocumentModule,
    MailModule,
    AttendanceModule,
    ExpensesModule,
    AnalyticsModule,
    ContractsModule,
    AnnouncementsModule,
    SettingsModule,
    AuditModule,
    ProjectsModule,
    TasksModule,
    MessagesModule,
    TagsModule,
    NotificationsModule,
    AdvancesModule,
    BonusesModule,
    BenefitsModule,
    PayslipsModule,
    RecruitmentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
