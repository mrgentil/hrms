import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { Prisma } from '@prisma/client';
import { CreateJobOfferDto, UpdateJobOfferDto } from './dto/job-offer.dto';
import { CreateCandidateDto, UpdateCandidateDto } from './dto/candidate.dto';
import { CreateApplicationDto, UpdateApplicationDto } from './dto/application.dto';
import { CreateInterviewDto, UpdateInterviewDto } from './dto/interview.dto';
import { CreateOnboardingDto, UpdateOnboardingDto } from './dto/onboarding.dto';

@Injectable()
export class RecruitmentService {
    private readonly logger = new Logger(RecruitmentService.name);

    constructor(
        private prisma: PrismaService,
        private mailService: MailService
    ) { }

    // ===================== JOB OFFERS =====================
    async findAllJobOffers() {
        return this.prisma.job_offer.findMany({
            include: {
                applications: {
                    include: { candidate: true }
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async findOneJobOffer(id: number) {
        return this.prisma.job_offer.findUnique({
            where: { id },
            include: {
                applications: {
                    include: { candidate: true, interviews: true }
                },
            },
        });
    }

    async createJobOffer(dto: CreateJobOfferDto) {
        return this.prisma.job_offer.create({
            data: {
                title: dto.title,
                description: dto.description,
                department: dto.department,
                location: dto.location,
                contract_type: dto.contractType,
                status: dto.status || 'DRAFT',
                posted_date: dto.postedDate ? new Date(dto.postedDate) : null,
                required_skills: dto.requiredSkills || [],
                min_experience: dto.minExperience || 0,
                scoring_criteria: dto.scoringCriteria || Prisma.JsonNull,
            },
        });
    }

    async updateJobOffer(id: number, dto: UpdateJobOfferDto) {
        const result = await this.prisma.job_offer.update({
            where: { id },
            data: {
                title: dto.title,
                description: dto.description,
                department: dto.department,
                location: dto.location,
                contract_type: dto.contractType,
                status: dto.status,
                posted_date: dto.postedDate ? new Date(dto.postedDate) : undefined,
                required_skills: dto.requiredSkills !== undefined ? dto.requiredSkills : undefined,
                min_experience: dto.minExperience !== undefined ? dto.minExperience : undefined,
                scoring_criteria: dto.scoringCriteria !== undefined ? dto.scoringCriteria : undefined,
            },
        });
    }

    async deleteJobOffer(id: number) {
        return this.prisma.job_offer.delete({ where: { id } });
    }

    // ===================== CANDIDATES =====================
    async findAllCandidates() {
        return this.prisma.candidate.findMany({
            include: { applications: { include: { job_offer: true } } },
            orderBy: { created_at: 'desc' },
        });
    }

    async findOneCandidate(id: number) {
        return this.prisma.candidate.findUnique({
            where: { id },
            include: {
                applications: {
                    include: {
                        job_offer: true,
                        interviews: {
                            include: {
                                interviewer: { select: { id: true, full_name: true } },
                            },
                        },
                    },
                },
            },
        });
    }

    async findTalentPool() {
        return this.prisma.candidate.findMany({
            where: { is_in_talent_pool: true },
            orderBy: { rating: 'desc' },
        });
    }

    async createCandidate(dto: CreateCandidateDto) {
        return this.prisma.candidate.create({
            data: {
                first_name: dto.firstName,
                last_name: dto.lastName,
                email: dto.email,
                phone: dto.phone,
                cv_url: dto.cvUrl,
                linkedin_url: dto.linkedinUrl,
                skills: dto.skills,
                rating: dto.rating || 0,
                is_in_talent_pool: dto.isInTalentPool || false,
            },
        });
    }

    async updateCandidate(id: number, dto: UpdateCandidateDto) {
        return this.prisma.candidate.update({
            where: { id },
            data: {
                first_name: dto.firstName,
                last_name: dto.lastName,
                email: dto.email,
                phone: dto.phone,
                cv_url: dto.cvUrl,
                linkedin_url: dto.linkedinUrl,
                skills: dto.skills,
                rating: dto.rating,
                is_in_talent_pool: dto.isInTalentPool,
            },
        });
    }

    // ===================== APPLICATIONS =====================
    async findAllApplications(jobOfferId?: number) {
        return this.prisma.candidate_application.findMany({
            where: jobOfferId ? { job_offer_id: jobOfferId } : undefined,
            include: {
                candidate: true,
                job_offer: true,
                interviews: { include: { interviewer: { select: { id: true, full_name: true } } } },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async findApplicationsByStage() {
        const applications = await this.prisma.candidate_application.findMany({
            include: {
                candidate: true,
                job_offer: true,
            },
            orderBy: { created_at: 'desc' },
        });

        // Group by stage for Kanban
        const stages = ['NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];
        const grouped = stages.map(stage => ({
            id: stage,
            name: this.getStageLabel(stage),
            applications: applications.filter(a => a.stage === stage),
        }));

        return grouped;
    }

    private getStageLabel(stage: string): string {
        const labels: Record<string, string> = {
            NEW: 'Nouveaux',
            SCREENING: 'Présélection',
            INTERVIEW: 'En Entretien',
            OFFER: 'Offre Envoyée',
            HIRED: 'Embauché',
            REJECTED: 'Refusé',
        };
        return labels[stage] || stage;
    }

    async createApplication(dto: CreateApplicationDto) {
        return this.prisma.candidate_application.create({
            data: {
                job_offer_id: dto.jobOfferId,
                candidate_id: dto.candidateId,
                status: 'NEW',
                stage: 'NEW',
            },
            include: { candidate: true, job_offer: true },
        });
    }

    async updateApplicationStage(id: number, stage: string) {
        const application = await this.prisma.candidate_application.update({
            where: { id },
            data: { stage, status: stage },
        });

        if (stage === 'HIRED') {
            await this.handleHiredCandidate(id);
        }

        return application;
    }

    /**
     * Automatisation : Création compte employé + Onboarding
     */
    private async handleHiredCandidate(applicationId: number) {
        try {
            const application = await this.prisma.candidate_application.findUnique({
                where: { id: applicationId },
                include: { candidate: true, job_offer: true }
            });

            if (!application || !application.candidate) return;

            const { candidate } = application;

            // 1. Vérifier si l'utilisateur existe déjà
            const existingUser = await this.prisma.user.findFirst({
                where: { username: candidate.email }
            });

            if (existingUser) {
                this.logger.log(`User already exists for candidate ${candidate.email}`);
                return;
            }

            // 2. Créer le compte Utilisateur
            const hashedPassword = await bcrypt.hash('Welcome123!', 10);
            const newUser = await this.prisma.user.create({
                data: {
                    username: candidate.email,
                    work_email: candidate.email,
                    password: hashedPassword,
                    full_name: `${candidate.first_name} ${candidate.last_name} `,
                    role: 'ROLE_EMPLOYEE',
                    active: true,
                    hire_date: new Date(),
                    created_at: new Date(),
                    updated_at: new Date(),
                }
            });

            this.logger.log(`Created new user for hired candidate: ${newUser.username} `);

            // 3. Créer le processus d'Onboarding
            await this.prisma.onboarding_process.create({
                data: {
                    employee_id: newUser.id,
                    status: 'PRE_BOARDING',
                    start_date: new Date(),
                    checklist: [
                        { title: "Signature Contrat", done: false },
                        { title: "Documents administratifs", done: false },
                        { title: "Configuration Email", done: false },
                        { title: "Préparation Matériel", done: false },
                        { title: "Badge d'accès", done: false },
                    ]
                }
            });

            this.logger.log(`Started onboarding process for user: ${newUser.id} `);

        } catch (error) {
            this.logger.error('Error handling hired candidate automation', error);
        }
    }

    async rejectApplication(id: number, sendEmail: boolean, addToTalentPool?: boolean) {
        this.logger.log(`Rejecting application ${id}. addToTalentPool: ${addToTalentPool}`);

        return this.prisma.$transaction(async (prisma) => {
            const application = await prisma.candidate_application.update({
                where: { id },
                data: { stage: 'REJECTED', status: 'REJECTED' },
                include: { candidate: true, job_offer: true },
            });

            // Add to Talent Pool if requested
            const shouldAddToPool = addToTalentPool === true || String(addToTalentPool) === 'true';

            if (shouldAddToPool && application.candidate) {
                this.logger.log(`Adding candidate ${application.candidate.id} to talent pool`);
                const updated = await prisma.candidate.update({
                    where: { id: application.candidate.id },
                    data: { is_in_talent_pool: true }
                });
                this.logger.log(`Candidate pooled: ${updated.is_in_talent_pool}`);
            }

            if (sendEmail && application.candidate?.email && application.job_offer) {
                // Email sending shouldn't revert the transaction, so we do it outside or catch it?
                // Sending inside transaction is risky if it takes time, but acceptable for now.
                // Better: schedule it or fire-and-forget.
                this.mailService.sendRejectionEmail(
                    {
                        firstName: application.candidate.first_name,
                        lastName: application.candidate.last_name,
                        email: application.candidate.email,
                    },
                    application.job_offer.title
                ).catch(err => this.logger.error('Failed to send rejection email', err));
            }

            return application;
        });
    }

    async deleteApplication(id: number) {
        // Supprimer d'abord les entretiens liés
        await this.prisma.job_interview.deleteMany({
            where: { application_id: id }
        });

        // Supprimer la candidature
        return this.prisma.candidate_application.delete({
            where: { id }
        });
    }

    // ===================== INTERVIEWS =====================
    async findAllInterviews() {
        return this.prisma.job_interview.findMany({
            include: {
                candidate: true,
                application: { include: { job_offer: true } },
                interviewer: { select: { id: true, full_name: true, profile_photo_url: true } },
            },
            orderBy: { interview_date: 'asc' },
        });
    }

    async createInterview(dto: CreateInterviewDto) {
        // Create the interview
        const interview = await this.prisma.job_interview.create({
            data: {
                application_id: dto.applicationId,
                candidate_id: dto.candidateId,
                interviewer_id: dto.interviewerId,
                interview_date: new Date(dto.interviewDate),
                type: dto.type || 'VISIO',
                status: 'SCHEDULED',
            },
            include: {
                candidate: true,
                application: { include: { job_offer: true } },
                interviewer: {
                    select: {
                        id: true,
                        full_name: true,
                        position: { select: { title: true } }
                    }
                }
            },
        });

        // Send Email Invitation
        if (interview.candidate && interview.candidate.email) {
            const role = interview.interviewer?.position?.title || "Service Recrutement";
            const jobTitle = interview.application?.job_offer?.title || "votre candidature";

            this.mailService.sendInterviewInvitation(
                {
                    firstName: interview.candidate.first_name,
                    lastName: interview.candidate.last_name,
                    email: interview.candidate.email,
                },
                {
                    date: interview.interview_date,
                    type: interview.type,
                    interviewerName: interview.interviewer?.full_name,
                    interviewerRole: role,
                    jobTitle: jobTitle
                }
            ).catch(err => console.error('Failed to send interview invitation email', err));
        }

        return interview;
    }

    async updateInterview(id: number, dto: UpdateInterviewDto) {
        return this.prisma.job_interview.update({
            where: { id },
            data: {
                interview_date: dto.interviewDate ? new Date(dto.interviewDate) : undefined,
                type: dto.type,
                status: dto.status,
                rating: dto.rating,
                feedback: dto.feedback,
            },
        });
    }

    // ===================== ONBOARDING =====================
    async findAllOnboarding() {
        return this.prisma.onboarding_process.findMany({
            include: {
                employee: { select: { id: true, full_name: true, profile_photo_url: true, position: true } },
                mentor: { select: { id: true, full_name: true } },
            },
            orderBy: { start_date: 'desc' },
        });
    }

    async createOnboarding(dto: CreateOnboardingDto) {
        return this.prisma.onboarding_process.create({
            data: {
                employee_id: dto.employeeId,
                mentor_id: dto.mentorId,
                status: 'PRE_BOARDING',
                start_date: new Date(dto.startDate),
                checklist: dto.checklist || [],
            },
            include: { employee: true, mentor: true },
        });
    }

    async updateOnboarding(id: number, dto: UpdateOnboardingDto) {
        return this.prisma.onboarding_process.update({
            where: { id },
            data: {
                status: dto.status,
                mentor_id: dto.mentorId,
                checklist: dto.checklist,
            },
        });
    }
}
