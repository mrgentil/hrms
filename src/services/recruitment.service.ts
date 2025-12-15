import api from './api.client';

// ===================== TYPES =====================

export interface ScoreBreakdown {
    skills: number;
    experience: number;
    interview: number;
    rating: number;
}

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

export interface ScoreResult {
    applicationId: number;
    candidateId: number;
    candidateName: string;
    score: number;
    breakdown: ScoreBreakdown;
    scoredAt: string;
}

export interface JobOffer {
    id: number;
    title: string;
    description?: string;
    department: string;
    location: string;
    contract_type: string;
    status: string;
    posted_date?: string;
    created_at: string;
    applications?: CandidateApplication[];
    // Scoring fields
    required_skills?: string[];
    min_experience?: number;
    scoring_criteria?: Record<string, number>;
}

export interface Candidate {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    cv_url?: string;
    linkedin_url?: string;
    skills?: string[];
    rating: number;
    years_experience?: number;
    is_in_talent_pool: boolean;
    created_at: string;
}

export interface CandidateApplication {
    id: number;
    job_offer_id: number;
    candidate_id: number;
    status: string;
    stage: string;
    created_at: string;
    candidate?: Candidate;
    job_offer?: JobOffer;
    interviews?: Interview[];
    // Scoring fields
    score?: number;
    score_breakdown?: ScoreBreakdown;
    scored_at?: string;
}

export interface Interview {
    id: number;
    application_id: number;
    candidate_id: number;
    interview_date: string;
    interviewer_id: number;
    type: string;
    status: string;
    rating?: number;
    feedback?: string;
    candidate?: Candidate;
    interviewer?: { id: number; full_name: string; profile_photo_url?: string };
    application?: CandidateApplication & { job_offer?: JobOffer };
}

export interface OnboardingProcess {
    id: number;
    employee_id: number;
    mentor_id?: number;
    status: string;
    start_date: string;
    checklist?: any[];
    employee?: { id: number; full_name: string; profile_photo_url?: string; position?: { title: string } };
    mentor?: { id: number; full_name: string };
}

export interface KanbanStage {
    id: string;
    name: string;
    applications: CandidateApplication[];
}

// ===================== SERVICE =====================

class RecruitmentService {
    private baseUrl = '/recruitment';

    // --- JOB OFFERS ---
    async getJobOffers(): Promise<JobOffer[]> {
        const response = await api.get(`${this.baseUrl}/jobs`);
        return response.data;
    }

    async getJobOffer(id: number): Promise<JobOffer> {
        const response = await api.get(`${this.baseUrl}/jobs/${id}`);
        return response.data;
    }

    async createJobOffer(data: Partial<JobOffer>): Promise<JobOffer> {
        const response = await api.post(`${this.baseUrl}/jobs`, {
            title: data.title,
            description: data.description,
            department: data.department,
            location: data.location,
            contractType: data.contract_type,
            status: data.status,
            postedDate: data.posted_date,
            requiredSkills: data.required_skills,
            minExperience: data.min_experience,
            scoringCriteria: data.scoring_criteria,
        });
        return response.data;
    }

    async updateJobOffer(id: number, data: Partial<JobOffer>): Promise<JobOffer> {
        const response = await api.put(`${this.baseUrl}/jobs/${id}`, {
            title: data.title,
            description: data.description,
            department: data.department,
            location: data.location,
            contractType: data.contract_type,
            status: data.status,
            postedDate: data.posted_date,
            requiredSkills: data.required_skills,
            minExperience: data.min_experience,
            scoringCriteria: data.scoring_criteria,
        });
        return response.data;
    }

    async deleteJobOffer(id: number): Promise<void> {
        await api.delete(`${this.baseUrl}/jobs/${id}`);
    }

    async extractSkills(description: string): Promise<string[]> {
        const response = await api.post(`${this.baseUrl}/job-offers/extract-skills`, { description });
        return response.data.skills || [];
    }


    // --- SCORING ---
    async getCandidateRanking(jobOfferId: number): Promise<RankedCandidate[]> {
        const response = await api.get(`${this.baseUrl}/jobs/${jobOfferId}/ranking`);
        return response.data;
    }

    async scoreAllCandidates(jobOfferId: number): Promise<ScoreResult[]> {
        const response = await api.post(`${this.baseUrl}/jobs/${jobOfferId}/score-all`);
        return response.data;
    }

    async scoreApplication(applicationId: number): Promise<ScoreResult> {
        const response = await api.post(`${this.baseUrl}/applications/${applicationId}/score`);
        return response.data;
    }

    // --- CANDIDATES ---
    async getCandidates(): Promise<Candidate[]> {
        const response = await api.get(`${this.baseUrl}/candidates`);
        return response.data;
    }

    async getCandidate(id: number): Promise<Candidate> {
        const response = await api.get(`${this.baseUrl}/candidates/${id}`);
        return response.data;
    }

    async getTalentPool(): Promise<Candidate[]> {
        const response = await api.get(`${this.baseUrl}/talent-pool`);
        return response.data;
    }

    async createCandidate(data: Partial<Candidate>): Promise<Candidate> {
        const response = await api.post(`${this.baseUrl}/candidates`, {
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            phone: data.phone,
            cvUrl: data.cv_url,
            linkedinUrl: data.linkedin_url,
            skills: data.skills,
            rating: data.rating,
            yearsExperience: data.years_experience,
            isInTalentPool: data.is_in_talent_pool,
        });
        return response.data;
    }

    // --- APPLICATIONS ---
    async getApplications(jobOfferId?: number): Promise<CandidateApplication[]> {
        const params = jobOfferId ? `?jobOfferId=${jobOfferId}` : '';
        const response = await api.get(`${this.baseUrl}/applications${params}`);
        return response.data;
    }

    async getApplicationsKanban(): Promise<KanbanStage[]> {
        const response = await api.get(`${this.baseUrl}/applications/kanban`);
        return response.data;
    }

    async createApplication(jobOfferId: number, candidateId: number): Promise<CandidateApplication> {
        const response = await api.post(`${this.baseUrl}/applications`, { jobOfferId, candidateId });
        return response.data;
    }

    async updateApplicationStage(applicationId: number, stage: string): Promise<CandidateApplication> {
        const response = await api.put(`${this.baseUrl}/applications/${applicationId}/stage`, { stage });
        return response.data;
    }

    async rejectApplication(id: number, sendEmail: boolean = true, addToTalentPool: boolean = false): Promise<CandidateApplication> {
        const response = await api.put(`${this.baseUrl}/applications/${id}/reject`, { sendEmail, addToTalentPool });
        return response.data;
    }

    async deleteApplication(applicationId: number): Promise<void> {
        await api.delete(`${this.baseUrl}/applications/${applicationId}`);
    }

    // --- INTERVIEWS ---
    async getInterviews(): Promise<Interview[]> {
        const response = await api.get(`${this.baseUrl}/interviews`);
        return response.data;
    }

    async createInterview(data: {
        applicationId: number;
        candidateId: number;
        interviewerId: number;
        interviewDate: string;
        type?: string;
    }): Promise<Interview> {
        const response = await api.post(`${this.baseUrl}/interviews`, data);
        return response.data;
    }

    async updateInterview(id: number, data: Partial<Interview>): Promise<Interview> {
        const response = await api.put(`${this.baseUrl}/interviews/${id}`, data);
        return response.data;
    }

    // --- ONBOARDING ---
    async getOnboardingList(): Promise<OnboardingProcess[]> {
        const response = await api.get(`${this.baseUrl}/onboarding`);
        return response.data;
    }

    async createOnboarding(data: { employeeId: number; mentorId?: number; startDate: string; checklist?: any[] }): Promise<OnboardingProcess> {
        const response = await api.post(`${this.baseUrl}/onboarding`, data);
        return response.data;
    }

    async updateOnboarding(id: number, data: Partial<OnboardingProcess>): Promise<OnboardingProcess> {
        const response = await api.put(`${this.baseUrl}/onboarding/${id}`, data);
        return response.data;
    }

    // --- CV UPLOAD ---
    async uploadCV(file: File, jobOfferId: number): Promise<CVUploadResult> {
        const formData = new FormData();
        formData.append('jobOfferId', jobOfferId.toString());
        formData.append('file', file);

        // Explicitly unset Content-Type to let browser set it with boundary
        const response = await api.post('/uploads/cv', formData, {
            headers: { 'Content-Type': undefined } as any
        });
        return response.data;
    }

    async uploadCVsBulk(files: File[], jobOfferId: number): Promise<CVUploadResult[]> {
        const formData = new FormData();
        formData.append('jobOfferId', jobOfferId.toString());
        files.forEach(file => formData.append('files', file));

        const response = await api.post('/uploads/cv/bulk', formData, {
            headers: { 'Content-Type': undefined } as any
        });
        return response.data;
    }
}

// CV Upload result type
export interface CVUploadResult {
    success: boolean;
    filename: string;
    candidateId?: number;
    applicationId?: number;
    score?: number;
    parsedData?: {
        firstName: string;
        lastName: string;
        email: string;
        skills: string[];
        yearsExperience: number;
    };
    error?: string;
}

export const recruitmentService = new RecruitmentService();


