import { Module } from '@nestjs/common';
import { PlanningService } from './planning.service';
import { PlanningController } from './planning.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [PrismaModule, RolesModule],
  controllers: [PlanningController],
  providers: [PlanningService],
})
export class PlanningModule {}
