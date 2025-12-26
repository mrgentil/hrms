import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { TrainingService } from './training.service';
import { CreateTrainingDto, CreateTrainingSessionDto, CreateTrainingCategoryDto } from './dto/create-training.dto';
import { CreateRegistrationDto, UpdateRegistrationStatusDto } from './dto/registrations.dto';
import { CreateCertificationDto, AssignCertificationDto } from './dto/certifications.dto';
import { CreateDevelopmentPlanDto, CreateObjectiveDto } from './dto/development-plans.dto';
import { CreateElearningModuleDto, UpdateProgressDto } from './dto/elearning.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Delete } from '@nestjs/common';

@Controller('training')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TrainingController {
    constructor(private readonly trainingService: TrainingService) { }

    // ==========================================
    // CATALOG & TRAININGS
    // ==========================================

    @Get('categories')
    @RequirePermissions('training.view')
    async getCategories() {
        return this.trainingService.getCategories();
    }

    @Post('categories')
    @RequirePermissions('training.create')
    async createCategory(@Body() dto: CreateTrainingCategoryDto) {
        return this.trainingService.createCategory(dto);
    }

    @Patch('categories/:id')
    @RequirePermissions('training.create')
    async updateCategory(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateTrainingCategoryDto>) {
        return this.trainingService.updateCategory(id, dto);
    }

    @Delete('categories/:id')
    @RequirePermissions('training.create')
    async deleteCategory(@Param('id', ParseIntPipe) id: number) {
        return this.trainingService.deleteCategory(id);
    }

    @Get()
    @RequirePermissions('training.view')
    async getAllTrainings(@Query() filters: any) {
        return this.trainingService.getAllTrainings(filters);
    }

    @Get('recommendations')
    @RequirePermissions('training.view_own')
    async getRecommendations(@CurrentUser() user: any) {
        return this.trainingService.getRecommendations(user.id);
    }

    @Get(':id')
    @RequirePermissions('training.view')
    async getTrainingById(@Param('id', ParseIntPipe) id: number) {
        return this.trainingService.getTrainingById(id);
    }

    @Post()
    @RequirePermissions('training.create')
    async createTraining(@CurrentUser() user: any, @Body() dto: CreateTrainingDto) {
        return this.trainingService.createTraining(user.id, dto);
    }

    @Patch(':id')
    @RequirePermissions('training.create')
    async updateTraining(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateTrainingDto>) {
        return this.trainingService.updateTraining(id, dto);
    }

    @Delete(':id')
    @RequirePermissions('training.create')
    async deleteTraining(@Param('id', ParseIntPipe) id: number) {
        return this.trainingService.deleteTraining(id);
    }

    @Post('sessions')
    @RequirePermissions('training.create')
    async createSession(@Body() dto: CreateTrainingSessionDto) {
        return this.trainingService.createSession(dto);
    }

    @Patch('sessions/:id')
    @RequirePermissions('training.create')
    async updateSession(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateTrainingSessionDto>) {
        return this.trainingService.updateSession(id, dto);
    }

    @Delete('sessions/:id')
    @RequirePermissions('training.create')
    async deleteSession(@Param('id', ParseIntPipe) id: number) {
        return this.trainingService.deleteSession(id);
    }

    // ==========================================
    // REGISTRATIONS
    // ==========================================

    @Post('registrations')
    @RequirePermissions('training.register')
    async register(@CurrentUser() user: any, @Body() dto: CreateRegistrationDto) {
        return this.trainingService.registerForTraining(user.id, dto);
    }

    @Post('registrations/assign')
    @RequirePermissions('training.manage')
    async assign(@CurrentUser() user: any, @Body() dto: any) {
        return this.trainingService.assignTraining(user.id, dto);
    }

    @Get('registrations/my')
    @RequirePermissions('training.view_own')
    async getMyRegistrations(@CurrentUser() user: any) {
        return this.trainingService.getMyRegistrations(user.id);
    }

    @Get('registrations/all')
    @RequirePermissions('training.manage')
    async getAllRegistrations() {
        return this.trainingService.getAllRegistrations();
    }

    @Get('registrations/pending-count')
    @RequirePermissions('training.manage')
    async getPendingRegistrationsCount() {
        const count = await this.trainingService.getPendingRegistrationsCount();
        return { count };
    }

    @Patch('registrations/:id/status')
    @RequirePermissions('training.manage')
    async updateRegistrationStatus(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: any,
        @Body() dto: UpdateRegistrationStatusDto,
    ) {
        return this.trainingService.updateRegistrationStatus(id, user.id, dto);
    }

    // ==========================================
    // CERTIFICATIONS
    // ==========================================

    @Get('certifications')
    @RequirePermissions('training.view')
    async getCertifications() {
        return this.trainingService.getCertifications();
    }

    @Post('certifications')
    @RequirePermissions('training.certifications')
    async createCertification(@Body() dto: CreateCertificationDto) {
        return this.trainingService.createCertification(dto);
    }

    @Patch('certifications/:id')
    @RequirePermissions('training.certifications')
    async updateCertification(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateCertificationDto>) {
        return this.trainingService.updateCertification(id, dto);
    }

    @Delete('certifications/:id')
    @RequirePermissions('training.certifications')
    async deleteCertification(@Param('id', ParseIntPipe) id: number) {
        return this.trainingService.deleteCertification(id);
    }

    @Get('certifications/my')
    @RequirePermissions('training.view_own')
    async getMyCertifications(@CurrentUser() user: any) {
        return this.trainingService.getUserCertifications(user.id);
    }

    @Post('certifications/assign')
    @RequirePermissions('training.certifications')
    async assignCertification(@Body() dto: AssignCertificationDto) {
        return this.trainingService.assignCertification(dto);
    }

    // ==========================================
    // DEVELOPMENT PLANS
    // ==========================================

    @Get('development-plans/my')
    @RequirePermissions('training.view_own')
    async getMyDevelopmentPlans(@CurrentUser() user: any) {
        return this.trainingService.getDevelopmentPlans(user.id);
    }

    @Post('development-plans')
    @RequirePermissions('training.view') // Managers can create
    async createDevelopmentPlan(@CurrentUser() user: any, @Body() dto: CreateDevelopmentPlanDto) {
        return this.trainingService.createDevelopmentPlan(user.id, dto);
    }

    @Post('development-plans/objectives')
    @RequirePermissions('training.view')
    async addObjective(@Body() dto: CreateObjectiveDto) {
        return this.trainingService.addObjective(dto);
    }

    // ==========================================
    // E-LEARNING
    // ==========================================

    @Get('elearning/modules')
    @RequirePermissions('training.view')
    async getElearningModules(@Query() filters: any) {
        return this.trainingService.getElearningModules(filters);
    }

    @Post('elearning/modules')
    @RequirePermissions('training.create')
    async createElearningModule(@Body() dto: CreateElearningModuleDto) {
        return this.trainingService.createElearningModule(dto);
    }

    @Patch('elearning/modules/:id')
    @RequirePermissions('training.create')
    async updateElearningModule(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateElearningModuleDto>) {
        return this.trainingService.updateElearningModule(id, dto);
    }

    @Delete('elearning/modules/:id')
    @RequirePermissions('training.create')
    async deleteElearningModule(@Param('id', ParseIntPipe) id: number) {
        return this.trainingService.deleteElearningModule(id);
    }

    @Get('elearning/my-progress')
    @RequirePermissions('training.view_own')
    async getMyElearningProgress(@CurrentUser() user: any) {
        return this.trainingService.getMyElearningProgress(user.id);
    }

    @Post('elearning/modules/:id/start')
    @RequirePermissions('training.view_own')
    async startModule(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
        return this.trainingService.startModule(user.id, id);
    }

    @Patch('elearning/modules/:id/progress')
    @RequirePermissions('training.view_own')
    async updateModuleProgress(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: any,
        @Body() dto: UpdateProgressDto,
    ) {
        return this.trainingService.updateModuleProgress(user.id, id, dto);
    }
}
