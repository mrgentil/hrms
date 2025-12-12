import { Module } from '@nestjs/common';
import { PayslipsController } from './payslips.controller';
import { PayslipsService } from './payslips.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AdvancesModule } from '../advances/advances.module';
import { RolesModule } from '../roles/roles.module';

@Module({
    imports: [PrismaModule, AdvancesModule, RolesModule],
    controllers: [PayslipsController],
    providers: [PayslipsService],
    exports: [PayslipsService],
})
export class PayslipsModule { }
