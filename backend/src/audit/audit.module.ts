import { Module, Global } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesModule } from '../roles/roles.module';

@Global() // Make it available everywhere without importing
@Module({
  imports: [PrismaModule, RolesModule],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
