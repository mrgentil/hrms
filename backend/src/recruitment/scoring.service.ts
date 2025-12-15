import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScoreBreakdown, ScoreResult, RankedCandidate } from './dto/scoring.dto';
import { Prisma } from '@prisma/client';

// Critères de scoring par défaut (en pourcentage)
const DEFAULT_CRITERIA = {
    skills: 40,
    experience: 25,
    interview: 20,
    rating: 15,
};

@Injectable()
export class ScoringService {
    constructor(private prisma: PrismaService) { }

    /**
     * Calcule le score d'une candidature spécifique
     */
    async calculateScore(applicationId: number): Promise<ScoreResult> {
        const application = await this.prisma.candidate_application.findUnique({
            where: { id: applicationId },
            include: {
                candidate: true,
                job_offer: true,
                interviews: true,
            },
        });

        if (!application) {
            throw new Error('Application not found');
        }

        // Récupérer les critères de scoring (personnalisés ou par défaut)
        const criteria = (application.job_offer.scoring_criteria as Record<string, number>) || DEFAULT_CRITERIA;

        // Calculer chaque composante du score
        const breakdown = this.computeBreakdown(application, criteria);

        // Calculer le score final pondéré
        const totalWeight = criteria.skills + criteria.experience + criteria.interview + criteria.rating;
        const score = Math.round(
            (breakdown.skills * criteria.skills +
                breakdown.experience * criteria.experience +
                breakdown.interview * criteria.interview +
                breakdown.rating * criteria.rating) / totalWeight
        );

        // Sauvegarder le score
        await this.prisma.candidate_application.update({
            where: { id: applicationId },
            data: {
                score,
                score_breakdown: breakdown as unknown as Prisma.InputJsonValue,
                scored_at: new Date(),
            },
        });

        return {
            applicationId,
            candidateId: application.candidate_id,
            candidateName: `${application.candidate.first_name} ${application.candidate.last_name}`,
            score,
            breakdown,
            scoredAt: new Date(),
            missingSkillsConfig: !application.job_offer.required_skills || (Array.isArray(application.job_offer.required_skills) && application.job_offer.required_skills.length === 0),
        };
    }

    /**
     * Calcule les scores de tous les candidats pour une offre d'emploi
     */
    async scoreAllCandidatesForJob(jobOfferId: number): Promise<ScoreResult[]> {
        const applications = await this.prisma.candidate_application.findMany({
            where: { job_offer_id: jobOfferId },
            select: { id: true },
        });

        const results: ScoreResult[] = [];
        for (const app of applications) {
            const result = await this.calculateScore(app.id);
            results.push(result);
        }

        // Trier par score décroissant
        return results.sort((a, b) => b.score - a.score);
    }

    /**
     * Récupère le classement des candidats pour une offre
     */
    async getCandidateRanking(jobOfferId: number): Promise<RankedCandidate[]> {
        const applications = await this.prisma.candidate_application.findMany({
            where: { job_offer_id: jobOfferId },
            include: {
                candidate: true,
            },
            orderBy: {
                score: 'desc',
            },
        });

        return applications.map((app, index) => {
            const breakdown = app.score_breakdown as unknown as ScoreBreakdown | null;
            return {
                rank: index + 1,
                applicationId: app.id,
                candidateId: app.candidate_id,
                candidateName: `${app.candidate.first_name} ${app.candidate.last_name}`,
                email: app.candidate.email,
                score: app.score || 0,
                breakdown: breakdown || { skills: 0, experience: 0, interview: 0, rating: 0 },
                stage: app.stage,
            };
        });
    }

    /**
     * Calcule le détail des scores pour chaque critère
     */
    private computeBreakdown(application: any, criteria: Record<string, number>): ScoreBreakdown {
        const candidate = application.candidate;
        const jobOffer = application.job_offer;
        const interviews = application.interviews || [];

        return {
            skills: this.calculateSkillsScore(candidate.skills, jobOffer.required_skills),
            experience: this.calculateExperienceScore(
                candidate.years_experience || 0,
                jobOffer.min_experience || 0
            ),
            interview: this.calculateInterviewScore(interviews),
            rating: this.calculateRatingScore(candidate.rating || 0),
        };
    }

    /**
     * Score basé sur la correspondance des compétences (0-100)
     */
    private calculateSkillsScore(candidateSkills: any, requiredSkills: any): number {
        if (!requiredSkills || !Array.isArray(requiredSkills) || requiredSkills.length === 0) {
            // Si pas de compétences requises, score neutre
            console.warn(`Job Offer has no required skills defined. Defaulting to 50.`);
            return 50;
        }

        const candidateSkillsArray: string[] = Array.isArray(candidateSkills)
            ? candidateSkills.map((s: string) => s.toLowerCase().trim())
            : [];

        if (candidateSkillsArray.length === 0) {
            return 0;
        }

        const requiredSkillsArray: string[] = requiredSkills.map((s: string) => s.toLowerCase().trim());

        // Compter les compétences correspondantes
        let matches = 0;
        for (const required of requiredSkillsArray) {
            if (candidateSkillsArray.some(skill =>
                skill.includes(required) || required.includes(skill)
            )) {
                matches++;
            }
        }

        return Math.round((matches / requiredSkillsArray.length) * 100);
    }

    /**
     * Score basé sur l'expérience (0-100)
     */
    private calculateExperienceScore(candidateExp: number, requiredExp: number): number {
        if (requiredExp === 0) {
            // Pas d'expérience requise = score neutre
            return 50;
        }

        if (candidateExp >= requiredExp) {
            // Expérience suffisante ou supérieure
            const bonus = Math.min((candidateExp - requiredExp) * 5, 20); // Bonus max 20 points
            return Math.min(100, 80 + bonus);
        }

        // Expérience insuffisante - score proportionnel
        return Math.round((candidateExp / requiredExp) * 80);
    }

    /**
     * Score basé sur les entretiens (0-100)
     */
    private calculateInterviewScore(interviews: any[]): number {
        if (!interviews || interviews.length === 0) {
            // Pas encore d'entretien = score neutre
            return 50;
        }

        const completedInterviews = interviews.filter(i => i.rating !== null && i.rating !== undefined);

        if (completedInterviews.length === 0) {
            return 50;
        }

        // Moyenne des notes d'entretien (supposant notes sur 5, converti en 100)
        const avgRating = completedInterviews.reduce((sum, i) => sum + (i.rating || 0), 0) / completedInterviews.length;
        return Math.round((avgRating / 5) * 100);
    }

    /**
     * Score basé sur le rating global du candidat (0-100)
     */
    private calculateRatingScore(rating: number): number {
        // Rating supposé sur 5, converti en 100
        if (rating === 0) {
            return 50; // Score neutre si pas de rating
        }
        return Math.round((rating / 5) * 100);
    }
}
