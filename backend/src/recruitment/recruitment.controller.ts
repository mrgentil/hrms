import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateJobOfferDto, UpdateJobOfferDto } from './dto/job-offer.dto';
import { CreateCandidateDto, UpdateCandidateDto } from './dto/candidate.dto';
import { CreateApplicationDto } from './dto/application.dto';
import { CreateInterviewDto, UpdateInterviewDto } from './dto/interview.dto';
import { CreateOnboardingDto, UpdateOnboardingDto } from './dto/onboarding.dto';

@Controller('recruitment')
@UseGuards(JwtAuthGuard)
export class RecruitmentController {
    constructor(private readonly recruitmentService: RecruitmentService) { }

    // ===================== JOB OFFERS =====================
    @Get('jobs')
    findAllJobs() {
        return this.recruitmentService.findAllJobOffers();
    }

    @Get('jobs/:id')
    findOneJob(@Param('id', ParseIntPipe) id: number) {
        return this.recruitmentService.findOneJobOffer(id);
    }

    @Post('jobs')
    createJob(@Body() dto: CreateJobOfferDto) {
        return this.recruitmentService.createJobOffer(dto);
    }

    @Put('jobs/:id')
    updateJob(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateJobOfferDto) {
        return this.recruitmentService.updateJobOffer(id, dto);
    }

    @Delete('jobs/:id')
    deleteJob(@Param('id', ParseIntPipe) id: number) {
        return this.recruitmentService.deleteJobOffer(id);
    }

    // ===================== CANDIDATES =====================
    @Get('candidates')
    findAllCandidates() {
        return this.recruitmentService.findAllCandidates();
    }

    @Get('talent-pool')
    findTalentPool() {
        return this.recruitmentService.findTalentPool();
    }

    @Post('candidates')
    createCandidate(@Body() dto: CreateCandidateDto) {
        return this.recruitmentService.createCandidate(dto);
    }

    @Put('candidates/:id')
    updateCandidate(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCandidateDto) {
        return this.recruitmentService.updateCandidate(id, dto);
    }

    // ===================== APPLICATIONS =====================
    @Get('applications')
    findAllApplications(@Query('jobOfferId') jobOfferId?: string) {
        return this.recruitmentService.findAllApplications(jobOfferId ? parseInt(jobOfferId) : undefined);
    }

    @Get('applications/kanban')
    findApplicationsByStage() {
        return this.recruitmentService.findApplicationsByStage();
    }

    @Post('applications')
    createApplication(@Body() dto: CreateApplicationDto) {
        return this.recruitmentService.createApplication(dto);
    }

    @Put('applications/:id/stage')
    updateApplicationStage(
        @Param('id', ParseIntPipe) id: number,
        @Body('stage') stage: string,
    ) {
        return this.recruitmentService.updateApplicationStage(id, stage);
    }

    // ===================== INTERVIEWS =====================
    @Get('interviews')
    findAllInterviews() {
        return this.recruitmentService.findAllInterviews();
    }

    @Post('interviews')
    createInterview(@Body() dto: CreateInterviewDto) {
        return this.recruitmentService.createInterview(dto);
    }

    @Put('interviews/:id')
    updateInterview(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInterviewDto) {
        return this.recruitmentService.updateInterview(id, dto);
    }

    // ===================== ONBOARDING =====================
    @Get('onboarding')
    findAllOnboarding() {
        return this.recruitmentService.findAllOnboarding();
    }

    @Post('onboarding')
    createOnboarding(@Body() dto: CreateOnboardingDto) {
        return this.recruitmentService.createOnboarding(dto);
    }

    @Put('onboarding/:id')
    updateOnboarding(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOnboardingDto) {
        return this.recruitmentService.updateOnboarding(id, dto);
    }
}
