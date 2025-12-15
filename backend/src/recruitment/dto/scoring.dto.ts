import { IsArray, IsInt, IsObject, IsOptional, IsString } from 'class-validator';

// DTO pour les critères de scoring
export class ScoringCriteriaDto {
    @IsOptional()
    @IsInt()
    skills?: number; // Poids pour les compétences (défaut: 40)

    @IsOptional()
    @IsInt()
    experience?: number; // Poids pour l'expérience (défaut: 25)

    @IsOptional()
    @IsInt()
    interview?: number; // Poids pour les entretiens (défaut: 20)

    @IsOptional()
    @IsInt()
    rating?: number; // Poids pour le rating (défaut: 15)
}

// Structure du détail des scores
export interface ScoreBreakdown {
    skills: number;       // Score pour compétences (0-100)
    experience: number;   // Score pour expérience (0-100)
    interview: number;    // Score pour entretiens (0-100)
    rating: number;       // Score pour rating (0-100)
}

// Résultat du calcul de score
export interface ScoreResult {
    applicationId: number;
    candidateId: number;
    candidateName: string;
    score: number;           // Score final pondéré (0-100)
    breakdown: ScoreBreakdown;
    scoredAt: Date;
    missingSkillsConfig?: boolean;
}

// Candidat avec son rang
export interface RankedCandidate {
    rank: number;
    applicationId: number;
    candidateId: number;
    candidateName: string;
    email: string;
    score: number;
    breakdown: ScoreBreakdown;
    stage: string;
}

// DTO pour mettre à jour les critères de scoring d'une offre
export class UpdateJobOfferScoringDto {
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    requiredSkills?: string[];

    @IsOptional()
    @IsInt()
    minExperience?: number;

    @IsOptional()
    @IsObject()
    scoringCriteria?: ScoringCriteriaDto;
}
