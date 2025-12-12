
import {
    Task,
    TaskColumn,
    TaskBoard,
    TaskPriority,
    TaskStatus
} from './projects.service';

export interface JobOffer {
    id: number;
    title: string;
    department: string;
    location: string;
    type: 'CDI' | 'CDD' | 'Stage' | 'Freelance';
    status: 'PUBLISHED' | 'DRAFT' | 'CLOSED';
    applicantsCount: number;
    postedDate: string;
    description: string;
    requirements: string[];
}

// Mock Data for Job Offers
const MOCK_JOBS: JobOffer[] = [
    {
        id: 1,
        title: "Senior Full Stack Developer",
        department: "R&D",
        location: "Paris, France",
        type: "CDI",
        status: "PUBLISHED",
        applicantsCount: 12,
        postedDate: "2024-12-10",
        description: "Nous recherchons un développeur expérimenté pour rejoindre notre équipe core.",
        requirements: ["React", "Node.js", "5 ans d'expérience"]
    },
    {
        id: 2,
        title: "Product Designer (UI/UX)",
        department: "Produit",
        location: "Remote",
        type: "CDI",
        status: "PUBLISHED",
        applicantsCount: 28,
        postedDate: "2024-12-08",
        description: "Créez les interfaces de demain pour nos outils RH.",
        requirements: ["Figma", "Design System", "Creativity"]
    },
    {
        id: 3,
        title: "HR Manager",
        department: "Ressources Humaines",
        location: "Lyon, France",
        type: "CDD",
        status: "DRAFT",
        applicantsCount: 0,
        postedDate: "2024-12-12",
        description: "Gérez l'onboarding et le suivi carrière des employés.",
        requirements: ["Droit du travail", "Empathie", "Organisation"]
    },
    {
        id: 4,
        title: "Marketing Intern",
        department: "Marketing",
        location: "Paris, France",
        type: "Stage",
        status: "CLOSED",
        applicantsCount: 45,
        postedDate: "2024-11-15",
        description: "Assistez notre CMO dans les campagnes digitales.",
        requirements: ["Social Media", "Canva", "Copywriting"]
    }
];

// Mock Data for Applications (mapped to Kanban Task structure)
const MOCK_COLUMNS: TaskColumn[] = [
    {
        id: 101,
        name: "Nouveaux",
        sort_order: 1,
        task: [
            {
                id: 1,
                title: "Jean Dupont",
                description: "Senior Full Stack Developer - 5 ans exp",
                status: "TODO" as TaskStatus,
                priority: "HIGH" as TaskPriority,
                due_date: "2023-12-20",
                task_column_id: 101,
                project_id: 999,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                task_assignment: [],
                user_task_created_by_user_idTouser: { id: 1, full_name: "Recruteur" }
            },
            {
                id: 2,
                title: "Marie Curie",
                description: "Product Designer - Portfolio incroyable",
                status: "TODO" as TaskStatus,
                priority: "MEDIUM" as TaskPriority,
                task_column_id: 101,
                project_id: 999,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                task_assignment: [],
                user_task_created_by_user_idTouser: { id: 1, full_name: "Recruteur" }
            }
        ]
    },
    {
        id: 102,
        name: "En Entretien",
        sort_order: 2,
        task: [
            {
                id: 3,
                title: "Pierre Martin",
                description: "Senior Full Stack Dev - Entretien technique",
                status: "IN_PROGRESS" as TaskStatus,
                priority: "CRITICAL" as TaskPriority,
                due_date: "2023-12-15",
                task_column_id: 102,
                project_id: 999,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                task_assignment: [{
                    id: 1,
                    user: { id: 2, full_name: "Lead Dev", profile_photo_url: "" }
                }],
                user_task_created_by_user_idTouser: { id: 1, full_name: "Recruteur" }
            }
        ]
    },
    {
        id: 103,
        name: "Offre Envoyée",
        sort_order: 3,
        task: []
    },
    {
        id: 104,
        name: "Embauché",
        sort_order: 4,
        task: [
            {
                id: 4,
                title: "Amélie Poulain",
                description: "Office Manager",
                status: "DONE" as TaskStatus,
                priority: "MEDIUM" as TaskPriority,
                task_column_id: 104,
                project_id: 999,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                task_assignment: [],
                user_task_created_by_user_idTouser: { id: 1, full_name: "Recruteur" }
            }
        ]
    },
    {
        id: 105,
        name: "Refusé",
        sort_order: 5,
        task: []
    }
];

class RecruitmentDemoService {
    async getJobOffers(): Promise<JobOffer[]> {
        return new Promise((resolve) => {
            setTimeout(() => resolve(MOCK_JOBS), 500); // Simulate network delay
        });
    }

    async getApplicationsBoard(): Promise<TaskBoard> {
        return new Promise((resolve) => {
            setTimeout(() => resolve({
                id: 999,
                name: "Recrutement",
                task_column: MOCK_COLUMNS
            }), 500);
        });
    }

    // Mock move for demo
    async moveApplication(applicationId: number, columnId: number): Promise<void> {
        console.log(`Moving application ${applicationId} to column ${columnId}`);
        return Promise.resolve();
    }

    // --- NEW METHODS FOR INTERVIEWS, ONBOARDING, TALENT POOL ---

    async getInterviews(): Promise<Interview[]> {
        return new Promise((resolve) => setTimeout(() => resolve(MOCK_INTERVIEWS), 400));
    }

    async getOnboardingList(): Promise<OnboardingProcess[]> {
        return new Promise((resolve) => setTimeout(() => resolve(MOCK_ONBOARDING), 400));
    }

    async getTalentPool(): Promise<TalentProfile[]> {
        return new Promise((resolve) => setTimeout(() => resolve(MOCK_TALENTS), 400));
    }
}

export const recruitmentDemoService = new RecruitmentDemoService();

// --- NEW INTERFACES & DATA ---

export interface Interview {
    id: number;
    candidateName: string;
    position: string;
    date: string;
    time: string;
    interviewer: string;
    type: 'VISIO' | 'PRESENTIEL' | 'PHONE';
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
    notes?: string;
}

export interface OnboardingProcess {
    id: number;
    employeeName: string;
    position: string;
    startDate: string;
    progress: number; // 0-100
    status: 'PRE_BOARDING' | 'WEEK_1' | 'MONTH_1' | 'COMPLETED';
    mentor: string;
}

export interface TalentProfile {
    id: number;
    name: string;
    title: string;
    skills: string[];
    experience: string;
    source: string; // LinkedIn, Cooptation...
    rating: number; // 1-5
    available: boolean;
}

const MOCK_INTERVIEWS: Interview[] = [
    { id: 1, candidateName: "Sophie Martin", position: "Product Designer", date: "2024-12-14", time: "10:00", interviewer: "Sarah Connor", type: "VISIO", status: "SCHEDULED" },
    { id: 2, candidateName: "Lucas Bernard", position: "Fullstack Dev", date: "2024-12-14", time: "14:30", interviewer: "John Doe", type: "PRESENTIEL", status: "SCHEDULED" },
    { id: 3, candidateName: "Emma Stone", position: "HR Manager", date: "2024-12-15", time: "11:00", interviewer: "Jane Smith", type: "VISIO", status: "SCHEDULED" },
    { id: 4, candidateName: "Marc Duboi", position: "Sales Exec", date: "2024-12-12", time: "09:00", interviewer: "Paul B.", type: "PHONE", status: "COMPLETED", notes: "Très bon profil, à revoir." },
];

const MOCK_ONBOARDING: OnboardingProcess[] = [
    { id: 1, employeeName: "Thomas Anderson", position: "Lead Dev", startDate: "2024-12-01", progress: 65, status: "WEEK_1", mentor: "Morpheus" },
    { id: 2, employeeName: "Leeloo Dallas", position: "Marketing Manager", startDate: "2024-12-10", progress: 15, status: "PRE_BOARDING", mentor: "Korben" },
    { id: 3, employeeName: "Ellen Ripley", position: "Safety Officer", startDate: "2024-11-15", progress: 100, status: "COMPLETED", mentor: "Bishop" },
];

const MOCK_TALENTS: TalentProfile[] = [
    { id: 1, name: "John Wick", title: "Security Expert", skills: ["Security", "Audit", "Risk"], experience: "10 ans", source: "Chasse", rating: 5, available: true },
    { id: 2, name: "Lara Croft", title: "Travel Manager", skills: ["English", "Logistics", "Sports"], experience: "5 ans", source: "LinkedIn", rating: 4, available: false },
    { id: 3, name: "Tony Stark", title: "Engineering Director", skills: ["Tech", "Leadership", "R&D"], experience: "15 ans", source: "Cooptation", rating: 5, available: true },
    { id: 4, name: "Bruce Banner", title: "Data Scientist", skills: ["Python", "Big Data", "Analytics"], experience: "8 ans", source: "Spontané", rating: 4, available: true },
];
