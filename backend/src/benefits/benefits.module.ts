import { Module } from '@nestjs/common';
import { BenefitsController } from './benefits.controller';
import { BenefitsService } from './benefits.service';
import { RolesModule } from '../roles/roles.module';

@Module({
    imports: [RolesModule],
    controllers: [BenefitsController],
    providers: [BenefitsService],
    exports: [BenefitsService],
})
export class BenefitsModule { }
