import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobOfferDto, UpdateJobOfferDto } from './dto/job-offer.dto';
import { CreateCandidateDto, UpdateCandidateDto } from './dto/candidate.dto';
import { CreateApplicationDto, UpdateApplicationDto } from './dto/application.dto';
import { CreateInterviewDto, UpdateInterviewDto } from './dto/interview.dto';
import { CreateOnboardingDto, UpdateOnboardingDto } from './dto/onboarding.dto';

import { MailService } from '../mail/mail.service';

@Injectable()
export class RecruitmentService {
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
            },
        });
    }

    async updateJobOffer(id: number, dto: UpdateJobOfferDto) {
        return this.prisma.job_offer.update({
            where: { id },
            data: {
                title: dto.title,
                description: dto.description,
                department: dto.department,
                location: dto.location,
                contract_type: dto.contractType,
                status: dto.status,
                posted_date: dto.postedDate ? new Date(dto.postedDate) : undefined,
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
        return this.prisma.candidate_application.update({
            where: { id },
            data: { stage, status: stage },
        });
    }

    async rejectApplication(id: number, sendEmail: boolean) {
        const application = await this.prisma.candidate_application.update({
            where: { id },
            data: { stage: 'REJECTED', status: 'REJECTED' },
            include: { candidate: true, job_offer: true },
        });

        if (sendEmail && application.candidate?.email && application.job_offer) {
            this.mailService.sendRejectionEmail(
                {
                    firstName: application.candidate.first_name,
                    lastName: application.candidate.last_name,
                    email: application.candidate.email,
                },
                application.job_offer.title
            ).catch(err => console.error('Failed to send rejection email', err));
        }

        return application;
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
