import { Module } from '@nestjs/common';
import { OrgchartService } from './orgchart.service';
import { OrgchartController } from './orgchart.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OrgchartController],
  providers: [OrgchartService],
  exports: [OrgchartService],
})
export class OrgchartModule {}
