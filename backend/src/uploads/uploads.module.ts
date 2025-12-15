import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { CVParserService } from './cv-parser.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RecruitmentModule } from '../recruitment/recruitment.module';

@Module({
    imports: [PrismaModule, RecruitmentModule],
    controllers: [UploadsController],
    providers: [UploadsService, CVParserService],
    exports: [UploadsService, CVParserService],
})
export class UploadsModule { }
