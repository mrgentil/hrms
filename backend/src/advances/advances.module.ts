import { Module } from '@nestjs/common';
import { AdvancesController } from './advances.controller';
import { AdvancesService } from './advances.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesModule } from '../roles/roles.module';

@Module({
    imports: [PrismaModule, RolesModule],
    controllers: [AdvancesController],
    providers: [AdvancesService],
    exports: [AdvancesService],
})
export class AdvancesModule { }
