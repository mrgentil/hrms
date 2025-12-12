import api from './api.client';

// ===================== TYPES =====================

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
        });
        return response.data;
    }

    async deleteJobOffer(id: number): Promise<void> {
        await api.delete(`${this.baseUrl}/jobs/${id}`);
    }

    // --- CANDIDATES ---
    async getCandidates(): Promise<Candidate[]> {
        const response = await api.get(`${this.baseUrl}/candidates`);
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
}

export const recruitmentService = new RecruitmentService();
