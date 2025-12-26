import api from './api.client';

export interface Training {
    id: number;
    title: string;
    description: string;
    category_id: number;
    level: string;
    duration_hours: number;
    is_online: boolean;
    instructor_name?: string;
    start_date?: string; // From session
    image_url?: string;
    category?: {
        name: string;
        color: string;
    };
}

export interface Registration {
    id: number;
    status: string;
    training: Training;
    requested_at: string;
}

const TrainingService = {
    // Catalog
    async getAllTrainings(filters?: any) {
        const response = await api.get('/training', { params: filters });
        return response.data;
    },

    async getRecommendations() {
        const response = await api.get('/training/recommendations');
        return response.data;
    },

    async getCategories() {
        const response = await api.get('/training/categories');
        return response.data;
    },

    async getTrainingById(id: number) {
        const response = await api.get(`/training/${id}`);
        return response.data;
    },

    async createTraining(data: any) {
        const response = await api.post('/training', data);
        return response.data;
    },

    async updateTraining(id: number, data: any) {
        const response = await api.patch(`/training/${id}`, data);
        return response.data;
    },

    async deleteTraining(id: number) {
        const response = await api.delete(`/training/${id}`);
        return response.data;
    },

    // Sessions
    async createSession(data: any) {
        const response = await api.post('/training/sessions', data);
        return response.data;
    },

    async updateSession(id: number, data: any) {
        const response = await api.patch(`/training/sessions/${id}`, data);
        return response.data;
    },

    async deleteSession(id: number) {
        const response = await api.delete(`/training/sessions/${id}`);
        return response.data;
    },

    async createCategory(data: any) {
        const response = await api.post('/training/categories', data);
        return response.data;
    },

    async updateCategory(id: number, data: any) {
        const response = await api.patch(`/training/categories/${id}`, data);
        return response.data;
    },

    async deleteCategory(id: number) {
        const response = await api.delete(`/training/categories/${id}`);
        return response.data;
    },

    // Registrations
    async register(data: { training_id: number; session_id?: number; notes?: string }) {
        const response = await api.post('/training/registrations', data);
        return response.data;
    },

    async assignTraining(data: { user_id: number; training_id: number; session_id?: number; notes?: string }) {
        const response = await api.post('/training/registrations/assign', data);
        return response.data;
    },

    async getMyRegistrations() {
        const response = await api.get('/training/registrations/my');
        return response.data;
    },

    async getAllRegistrations() {
        const response = await api.get('/training/registrations/all');
        return response.data;
    },

    async updateRegistrationStatus(id: number, status: string, feedback?: string) {
        const response = await api.patch(`/training/registrations/${id}/status`, { status, feedback });
        return response.data;
    },

    async getPendingRegistrationsCount() {
        const response = await api.get('/training/registrations/pending-count');
        return response.data;
    },

    // Certifications
    async getMyCertifications() {
        const response = await api.get('/training/certifications/my');
        return response.data;
    },

    async getCertifications() {
        const response = await api.get('/training/certifications');
        return response.data;
    },

    async createCertification(data: any) {
        const response = await api.post('/training/certifications', data);
        return response.data;
    },

    async updateCertification(id: number, data: any) {
        const response = await api.patch(`/training/certifications/${id}`, data);
        return response.data;
    },

    async deleteCertification(id: number) {
        const response = await api.delete(`/training/certifications/${id}`);
        return response.data;
    },

    // Development Plans
    async getMyDevelopmentPlans() {
        const response = await api.get('/training/development-plans/my');
        return response.data;
    },

    // E-Learning
    async getElearningModules(filters?: any) {
        const response = await api.get('/training/elearning/modules', { params: filters });
        return response.data;
    },

    async createElearningModule(data: any) {
        const response = await api.post('/training/elearning/modules', data);
        return response.data;
    },

    async updateElearningModule(id: number, data: any) {
        const response = await api.patch(`/training/elearning/modules/${id}`, data);
        return response.data;
    },

    async deleteElearningModule(id: number) {
        const response = await api.delete(`/training/elearning/modules/${id}`);
        return response.data;
    },

    async getMyElearningProgress() {
        const response = await api.get('/training/elearning/my-progress');
        return response.data;
    },
};

export default TrainingService;
