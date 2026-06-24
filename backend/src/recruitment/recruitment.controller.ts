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
import { ScoringService } from './scoring.service';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CreateJobOfferDto, UpdateJobOfferDto } from './dto/job-offer.dto';
import { CreateCandidateDto, UpdateCandidateDto } from './dto/candidate.dto';
import { CreateApplicationDto } from './dto/application.dto';
import { CreateInterviewDto, UpdateInterviewDto } from './dto/interview.dto';
import { CreateOnboardingDto, UpdateOnboardingDto } from './dto/onboarding.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('recruitment')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RecruitmentController {
    constructor(
        private readonly recruitmentService: RecruitmentService,
        private readonly scoringService: ScoringService,
        private readonly aiService: AiService,
    ) { }

    // ===================== JOB OFFERS =====================
    @Get('jobs')
    @RequirePermissions('recruitment.view')
    findAllJobs(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('search') search?: string,
        @CurrentUser() user?: any,
    ) {
        return this.recruitmentService.findAllJobOffers({ page, limit, search }, user);
    }

    @Get('jobs/:id')
    @RequirePermissions('recruitment.view')
    findOneJob(@Param('id', ParseIntPipe) id: number) {
        return this.recruitmentService.findOneJobOffer(id);
    }

    @Post('jobs')
    @RequirePermissions('recruitment.manage')
    createJob(@Body() dto: CreateJobOfferDto) {
        return this.recruitmentService.createJobOffer(dto);
    }

    @Post('job-offers/extract-skills')
    @RequirePermissions('recruitment.manage')
    async extractSkills(@Body('description') description: string) {
        const skills = await this.aiService.extractSkillsFromText(description);
        return { skills };
    }

    @Put('jobs/:id')
    @RequirePermissions('recruitment.manage')
    updateJob(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateJobOfferDto) {
        return this.recruitmentService.updateJobOffer(id, dto);
    }

    @Delete('jobs/:id')
    @RequirePermissions('recruitment.manage')
    deleteJob(@Param('id', ParseIntPipe) id: number) {
        return this.recruitmentService.deleteJobOffer(id);
    }

    // ===================== SCORING =====================
    @Get('jobs/:id/ranking')
    @RequirePermissions('recruitment.view')
    getCandidateRanking(@Param('id', ParseIntPipe) id: number) {
        return this.scoringService.getCandidateRanking(id);
    }

    @Post('jobs/:id/score-all')
    @RequirePermissions('recruitment.manage')
    scoreAllCandidates(@Param('id', ParseIntPipe) id: number) {
        return this.scoringService.scoreAllCandidatesForJob(id);
    }

    // ===================== CANDIDATES =====================
    @Get('candidates')
    @RequirePermissions('recruitment.view')
    findAllCandidates(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('search') search?: string,
        @CurrentUser() user?: any,
    ) {
        return this.recruitmentService.findAllCandidates({ page, limit, search }, user);
    }

    @Get('candidates/:id')
    @RequirePermissions('recruitment.view')
    findOneCandidate(@Param('id', ParseIntPipe) id: number) {
        return this.recruitmentService.findOneCandidate(id);
    }

    @Get('talent-pool')
    @RequirePermissions('recruitment.view')
    findTalentPool() {
        return this.recruitmentService.findTalentPool();
    }

    @Post('candidates')
    @RequirePermissions('recruitment.manage')
    createCandidate(@Body() dto: CreateCandidateDto) {
        return this.recruitmentService.createCandidate(dto);
    }

    @Put('candidates/:id')
    @RequirePermissions('recruitment.manage')
    updateCandidate(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCandidateDto) {
        return this.recruitmentService.updateCandidate(id, dto);
    }

    // ===================== APPLICATIONS =====================
    @Get('applications')
    @RequirePermissions('recruitment.view')
    findAllApplications(@Query('jobOfferId') jobOfferId?: string, @CurrentUser() user?: any) {
        return this.recruitmentService.findAllApplications(jobOfferId ? parseInt(jobOfferId) : undefined, user);
    }

    @Get('applications/kanban')
    @RequirePermissions('recruitment.view')
    findApplicationsByStage() {
        return this.recruitmentService.findApplicationsByStage();
    }

    @Post('applications')
    @RequirePermissions('recruitment.manage')
    createApplication(@Body() dto: CreateApplicationDto) {
        return this.recruitmentService.createApplication(dto);
    }

    @Put('applications/:id/stage')
    @RequirePermissions('recruitment.manage')
    updateApplicationStage(
        @Param('id', ParseIntPipe) id: number,
        @Body('stage') stage: string,
    ) {
        return this.recruitmentService.updateApplicationStage(id, stage);
    }

    @Put('applications/:id/reject')
    @RequirePermissions('recruitment.manage')
    rejectApplication(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: any
    ) {
        console.log('Reject Application Body:', body);
        const sendEmail = body.sendEmail;
        const addToTalentPool = body.addToTalentPool;
        return this.recruitmentService.rejectApplication(id, sendEmail, addToTalentPool);
    }

    @Delete('applications/:id')
    @RequirePermissions('recruitment.manage')
    deleteApplication(@Param('id', ParseIntPipe) id: number) {
        return this.recruitmentService.deleteApplication(id);
    }

    @Post('applications/:id/score')
    @RequirePermissions('recruitment.manage')
    scoreApplication(@Param('id', ParseIntPipe) id: number) {
        return this.scoringService.calculateScore(id);
    }

    // ===================== INTERVIEWS =====================
    @Get('interviews')
    @RequirePermissions('recruitment.view')
    findAllInterviews(@CurrentUser() user?: any) {
        return this.recruitmentService.findAllInterviews(user);
    }

    @Post('interviews')
    @RequirePermissions('recruitment.manage')
    createInterview(@Body() dto: CreateInterviewDto) {
        return this.recruitmentService.createInterview(dto);
    }

    @Put('interviews/:id')
    @RequirePermissions('recruitment.manage')
    updateInterview(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInterviewDto) {
        return this.recruitmentService.updateInterview(id, dto);
    }

    // ===================== ONBOARDING =====================
    @Get('onboarding')
    @RequirePermissions('recruitment.view')
    findAllOnboarding(@CurrentUser() user?: any) {
        return this.recruitmentService.findAllOnboarding(user);
    }

    @Post('onboarding')
    @RequirePermissions('recruitment.manage')
    createOnboarding(@Body() dto: CreateOnboardingDto) {
        return this.recruitmentService.createOnboarding(dto);
    }

    @Put('onboarding/:id')
    @RequirePermissions('recruitment.manage')
    updateOnboarding(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOnboardingDto) {
        return this.recruitmentService.updateOnboarding(id, dto);
    }
}

