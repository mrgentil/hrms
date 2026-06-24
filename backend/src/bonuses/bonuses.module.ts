import { Module } from '@nestjs/common';
import { BonusesController } from './bonuses.controller';
import { BonusesService } from './bonuses.service';
import { RolesModule } from '../roles/roles.module';

@Module({
    imports: [RolesModule],
    controllers: [BonusesController],
    providers: [BonusesService],
    exports: [BonusesService],
})
export class BonusesModule { }
