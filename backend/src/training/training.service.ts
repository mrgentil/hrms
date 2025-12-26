import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateTrainingDto, CreateTrainingSessionDto } from './dto/create-training.dto';
import { CreateRegistrationDto, UpdateRegistrationStatusDto } from './dto/registrations.dto';
import { CreateCertificationDto, AssignCertificationDto } from './dto/certifications.dto';
import { CreateDevelopmentPlanDto, CreateObjectiveDto } from './dto/development-plans.dto';
import { CreateElearningModuleDto, UpdateProgressDto } from './dto/elearning.dto';

@Injectable()
export class TrainingService {
    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
        private notificationsService: NotificationsService
    ) { }

    // ==========================================
    // CATALOG & TRAININGS
    // ==========================================

    async getCategories() {
        return this.prisma.training_category.findMany({
            where: { is_active: true },
            include: { _count: { select: { trainings: true } } },
        });
    }

    async createCategory(dto: any) {
        return this.prisma.training_category.create({
            data: dto,
        });
    }

    async updateCategory(id: number, dto: any) {
        return this.prisma.training_category.update({
            where: { id },
            data: dto,
        });
    }

    async deleteCategory(id: number) {
        return this.prisma.training_category.delete({
            where: { id },
        });
    }

    async getAllTrainings(filters: any = {}) {
        return this.prisma.training.findMany({
            where: {
                is_active: true,
                ...filters,
            },
            include: { category: true, sessions: true },
        });
    }

    async getTrainingById(id: number) {
        const training = await this.prisma.training.findUnique({
            where: { id },
            include: {
                category: true,
                sessions: {
                    include: {
                        _count: { select: { registrations: true } },
                    },
                },
            },
        });
        if (!training) throw new NotFoundException('Formation introuvable');
        return training;
    }

    async createTraining(userId: number, dto: CreateTrainingDto) {
        return this.prisma.training.create({
            data: {
                ...dto,
                created_by_user_id: userId,
            },
        });
    }

    async updateTraining(id: number, dto: Partial<CreateTrainingDto>) {
        return this.prisma.training.update({
            where: { id },
            data: dto,
        });
    }

    async deleteTraining(id: number) {
        return this.prisma.training.delete({
            where: { id },
        });
    }

    async createSession(dto: CreateTrainingSessionDto) {
        return this.prisma.training_session.create({
            data: dto,
        });
    }

    async updateSession(id: number, dto: Partial<CreateTrainingSessionDto>) {
        return this.prisma.training_session.update({
            where: { id },
            data: dto,
        });
    }

    async deleteSession(id: number) {
        return this.prisma.training_session.delete({
            where: { id },
        });
    }

    // ==========================================
    // REGISTRATIONS
    // ==========================================

    async registerForTraining(userId: number, dto: CreateRegistrationDto) {
        const registration = await this.prisma.training_registration.create({
            data: {
                user_id: userId,
                training_id: dto.training_id,
                session_id: dto.session_id,
                notes: dto.notes,
                status: 'PENDING',
            },
            include: {
                user: { select: { id: true, full_name: true } },
                training: { select: { id: true, title: true } },
            },
        });

        // Notify admins/RH
        await this.notificationsService.notifyNewTrainingRegistration(
            userId,
            registration.training_id,
            registration.training.title,
            registration.user.full_name
        );

        return registration;
    }

    async assignTraining(adminId: number, dto: any) {
        const registration = await this.prisma.training_registration.create({
            data: {
                user_id: dto.user_id,
                training_id: dto.training_id,
                session_id: dto.session_id,
                notes: dto.notes,
                status: 'APPROVED',
                approved_by_id: adminId,
                approved_at: new Date(),
            },
            include: {
                user: { select: { id: true, full_name: true } },
                training: { select: { id: true, title: true } },
            },
        });

        // Notify user
        await this.notificationsService.notifyTrainingApproved(
            dto.user_id,
            dto.training_id,
            registration.training.title,
            'Administration'
        );

        return registration;
    }

    async getMyRegistrations(userId: number) {
        return this.prisma.training_registration.findMany({
            where: { user_id: userId },
            include: {
                training: {
                    include: {
                        category: true,
                    },
                },
                session: true,
                certificate: true,
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async getAllRegistrations() {
        return this.prisma.training_registration.findMany({
            include: {
                user: { select: { id: true, full_name: true, department: true } },
                training: true,
                session: true,
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async getPendingRegistrationsCount() {
        return this.prisma.training_registration.count({
            where: { status: 'PENDING' },
        });
    }

    async updateRegistrationStatus(id: number, userId: number, dto: UpdateRegistrationStatusDto) {
        const registration = await this.prisma.training_registration.update({
            where: { id },
            data: {
                status: dto.status,
                feedback: dto.feedback,
                score: dto.score,
                approved_by_id: dto.status === 'APPROVED' ? userId : undefined,
                approved_at: dto.status === 'APPROVED' ? new Date() : undefined,
                completed_at: dto.status === 'COMPLETED' ? new Date() : undefined,
            },
            include: {
                user: true,
                training: true,
                approved_by: true
            }
        });

        // Notifications & Emails
        if (dto.status === 'APPROVED' || dto.status === 'REJECTED') {
            const approverName = registration.approved_by?.full_name || 'Un administrateur';

            // In-app Notification
            if (dto.status === 'APPROVED') {
                await this.notificationsService.notifyTrainingApproved(
                    registration.user_id,
                    registration.training_id,
                    registration.training.title,
                    approverName
                );
            } else {
                await this.notificationsService.notifyTrainingRejected(
                    registration.user_id,
                    registration.training_id,
                    registration.training.title,
                    approverName,
                    dto.feedback // use feedback as reason
                );
            }

            // Email Notification
            const [firstName, ...lastNameParts] = (registration.user.full_name || '').split(' ');
            await this.mailService.sendTrainingStatusEmail(
                {
                    email: registration.user.work_email || '',
                    firstName: firstName || 'Collaborateur',
                    lastName: lastNameParts.join(' ') || ''
                },
                {
                    title: registration.training.title,
                    status: dto.status,
                    reason: dto.feedback
                }
            );
        }

        return registration;
    }

    // ==========================================
    // CERTIFICATIONS
    // ==========================================

    async getCertifications() {
        return this.prisma.certification.findMany({
            where: { is_active: true },
        });
    }

    async createCertification(dto: CreateCertificationDto) {
        return this.prisma.certification.create({
            data: dto,
        });
    }

    async updateCertification(id: number, dto: Partial<CreateCertificationDto>) {
        return this.prisma.certification.update({
            where: { id },
            data: dto,
        });
    }

    async deleteCertification(id: number) {
        return this.prisma.certification.delete({
            where: { id },
        });
    }

    async getUserCertifications(userId: number) {
        return this.prisma.user_certification.findMany({
            where: { user_id: userId },
            include: { certification: true },
        });
    }

    async assignCertification(dto: AssignCertificationDto) {
        return this.prisma.user_certification.create({
            data: {
                user_id: dto.user_id,
                certification_id: dto.certification_id,
                obtained_date: dto.obtained_date,
                expiry_date: dto.expiry_date,
                credential_id: dto.credential_id,
                credential_url: dto.credential_url,
            },
        });
    }

    // ==========================================
    // DEVELOPMENT PLANS
    // ==========================================

    async getDevelopmentPlans(userId: number) {
        return this.prisma.development_plan.findMany({
            where: { user_id: userId },
            include: { objectives: true },
        });
    }

    async createDevelopmentPlan(creatorId: number, dto: CreateDevelopmentPlanDto) {
        return this.prisma.development_plan.create({
            data: {
                user_id: dto.user_id,
                title: dto.title,
                description: dto.description,
                start_date: dto.start_date,
                target_date: dto.target_date,
                created_by_id: creatorId,
            },
        });
    }

    async addObjective(dto: CreateObjectiveDto) {
        return this.prisma.development_objective.create({
            data: dto,
        });
    }

    // ==========================================
    // E-LEARNING
    // ==========================================

    async getElearningModules(filters: any = {}) {
        return this.prisma.elearning_module.findMany({
            where: {
                is_active: true,
                ...filters,
            },
            include: { category: true },
        });
    }

    async createElearningModule(dto: CreateElearningModuleDto) {
        return this.prisma.elearning_module.create({
            data: dto,
        });
    }

    async updateElearningModule(id: number, dto: Partial<CreateElearningModuleDto>) {
        return this.prisma.elearning_module.update({
            where: { id },
            data: dto,
        });
    }

    async deleteElearningModule(id: number) {
        return this.prisma.elearning_module.delete({
            where: { id },
        });
    }

    async getMyElearningProgress(userId: number) {
        return this.prisma.elearning_progress.findMany({
            where: { user_id: userId },
            include: { module: true },
        });
    }

    async startModule(userId: number, moduleId: number) {
        return this.prisma.elearning_progress.upsert({
            where: { user_id_module_id: { user_id: userId, module_id: moduleId } },
            create: {
                user_id: userId,
                module_id: moduleId,
                started_at: new Date(),
                last_accessed_at: new Date(),
                status: 'IN_PROGRESS',
            },
            update: {
                last_accessed_at: new Date(),
            },
        });
    }

    async updateModuleProgress(userId: number, moduleId: number, dto: UpdateProgressDto) {
        const status = dto.progress_percent >= 100 ? 'COMPLETED' : 'IN_PROGRESS';
        const completed_at = dto.progress_percent >= 100 ? new Date() : undefined;

        const progress = await this.prisma.elearning_progress.update({
            where: { user_id_module_id: { user_id: userId, module_id: moduleId } },
            data: {
                progress_percent: dto.progress_percent,
                score: dto.score,
                status,
                completed_at,
                last_accessed_at: new Date(),
            },
            include: { module: true }
        });

        // Trigger Badge Notification if just completed
        if (status === 'COMPLETED') {
            await this.notificationsService.notifyBadgeEarned(
                userId,
                moduleId,
                progress.module.title
            );
        }

        return progress;
    }

    async getRecommendations(userId: number) {
        // 1. Get user data with position and development plans
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                position: true,
                development_plans: {
                    where: { status: 'ACTIVE' },
                    include: { objectives: true }
                }
            }
        });

        if (!user) return [];

        // 2. Get user's current registrations to avoid recommending what they already have
        const myRegistrations = await this.prisma.training_registration.findMany({
            where: { user_id: userId },
            select: { training_id: true }
        });
        const registeredIds = myRegistrations.map(r => r.training_id);

        // 3. Get all active trainings
        const allTrainings = await this.prisma.training.findMany({
            where: {
                is_active: true,
                id: { notIn: registeredIds }
            },
            include: { category: true }
        });

        // 4. Recommendation Logic (Simulated smart logic)
        const userKeywords = new Set<string>();

        // Add position keywords
        if (user.position?.title) user.position.title.split(' ').forEach(k => userKeywords.add(k.toLowerCase()));
        if (user.position?.description) user.position.description.split(' ').forEach(k => userKeywords.add(k.toLowerCase()));

        // Add objective keywords
        user.development_plans.forEach(plan => {
            plan.objectives.forEach(obj => {
                if (obj.skill_area) obj.skill_area.split(' ').forEach(k => userKeywords.add(k.toLowerCase()));
                if (obj.title) obj.title.split(' ').forEach(k => userKeywords.add(k.toLowerCase()));
            });
        });

        // Filter and score trainings
        const recommended = allTrainings.map(training => {
            let score = 0;
            const trainingText = (training.title + ' ' + (training.description || '')).toLowerCase();

            userKeywords.forEach(keyword => {
                if (keyword.length > 3 && trainingText.includes(keyword)) {
                    score += 1;
                }
            });

            // Boost mandatory trainings
            if (training.is_mandatory) score += 2;

            return { ...training, score };
        })
            .filter(t => t.score > 0 || t.is_mandatory)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3); // Top 3

        return recommended;
    }
}
