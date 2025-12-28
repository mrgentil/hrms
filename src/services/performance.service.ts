import api from './api.client';

// ============================================
// TYPES
// ============================================

export interface User {
  id: number;
  full_name: string;
  profile_photo_url?: string;
  work_email?: string;
  position?: { title: string };
  department?: { department_name: string };
}

export interface Campaign {
  id: number;
  title: string;
  description?: string;
  type: 'ANNUAL' | 'SEMI_ANNUAL' | 'QUARTERLY' | 'PROBATION' | 'PROJECT';
  year: number;
  start_date: string;
  end_date: string;
  self_review_deadline?: string;
  manager_review_deadline?: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  weight_self: number;
  weight_manager: number;
  weight_feedback360: number;
  creator?: User;
  _count?: { reviews: number };
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: number;
  campaign_id: number;
  campaign?: Campaign;
  employee_id: number;
  employee?: User;
  manager_id: number;
  manager?: User;
  status: 'PENDING_SELF' | 'PENDING_MANAGER' | 'PENDING_FEEDBACK' | 'PENDING_FINAL' | 'COMPLETED' | 'CANCELLED';
  self_rating?: number;
  self_comments?: string;
  self_submitted_at?: string;
  manager_rating?: number;
  manager_comments?: string;
  manager_submitted_at?: string;
  final_rating?: number;
  final_comments?: string;
  finalized_at?: string;
  objectives?: Objective[];
  feedback_requests?: FeedbackRequest[];
  improvement_plan?: ImprovementPlan;
  _count?: { objectives: number; feedback_requests: number };
  created_at: string;
  updated_at: string;
}

export interface KeyResult {
  id: number;
  objective_id: number;
  title: string;
  target_value?: number;
  current_value?: number;
  unit?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface Objective {
  id: number;
  review_id?: number;
  review?: { id: number; campaign?: { id: number; title: string; year: number } };
  employee_id: number;
  employee?: User;
  title: string;
  description?: string;
  type: 'INDIVIDUAL' | 'TEAM' | 'COMPANY';
  category?: string;
  metric_type: 'PERCENTAGE' | 'NUMBER' | 'CURRENCY' | 'BOOLEAN' | 'CUSTOM';
  target_value?: number;
  current_value?: number;
  weight: number;
  start_date: string;
  due_date: string;
  completed_at?: string;
  self_progress?: number;
  self_comments?: string;
  manager_progress?: number;
  manager_comments?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  key_results?: KeyResult[];
  created_at: string;
  updated_at: string;
}

export interface FeedbackRequest {
  id: number;
  review_id: number;
  review?: Review;
  reviewer_id: number;
  reviewer?: User;
  requested_by_id: number;
  status: 'PENDING' | 'SUBMITTED' | 'DECLINED';
  rating?: number;
  responses?: any;
  comments?: string;
  is_anonymous: boolean;
  submitted_at?: string;
  created_at: string;
}

export interface ImprovementAction {
  id: number;
  plan_id: number;
  title: string;
  description?: string;
  due_date?: string;
  completed_at?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  employee_notes?: string;
  manager_notes?: string;
}

export interface ImprovementPlan {
  id: number;
  review_id?: number;
  review?: Review;
  employee_id: number;
  employee?: User;
  manager_id: number;
  manager?: User;
  title: string;
  reason?: string;
  start_date: string;
  end_date: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  actions?: ImprovementAction[];
  _count?: { actions: number };
  created_at: string;
  updated_at: string;
}

export interface Recognition {
  id: number;
  from_user_id: number;
  from_user?: User;
  to_user_id: number;
  to_user?: User;
  type: 'KUDOS' | 'BADGE' | 'AWARD';
  badge?: string;
  message: string;
  is_public: boolean;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// SERVICE
// ============================================

const PerformanceService = {
  // ==================
  // CAMPAIGNS
  // ==================
  async getCampaigns(params?: { status?: string; year?: number; page?: number; limit?: number }) {
    const response = await api.get('/performance/campaigns', { params });
    return response.data;
  },

  async getCampaign(id: number) {
    const response = await api.get(`/performance/campaigns/${id}`);
    return response.data;
  },

  async createCampaign(data: Partial<Campaign>) {
    const response = await api.post('/performance/campaigns', data);
    return response.data;
  },

  async updateCampaign(id: number, data: Partial<Campaign>) {
    const response = await api.patch(`/performance/campaigns/${id}`, data);
    return response.data;
  },

  async launchCampaign(id: number) {
    const response = await api.post(`/performance/campaigns/${id}/launch`);
    return response.data;
  },

  async closeCampaign(id: number) {
    const response = await api.post(`/performance/campaigns/${id}/close`);
    return response.data;
  },

  async deleteCampaign(id: number) {
    const response = await api.delete(`/performance/campaigns/${id}`);
    return response.data;
  },

  async getCampaignStats(id: number) {
    const response = await api.get(`/performance/campaigns/${id}/stats`);
    return response.data;
  },

  // ==================
  // REVIEWS
  // ==================
  async getReviews(params?: { campaign_id?: number; employee_id?: number; status?: string; page?: number }) {
    const response = await api.get('/performance/reviews', { params });
    return response.data;
  },

  async getMyReviews() {
    const response = await api.get('/performance/reviews/my');
    return response.data;
  },

  async getTeamReviews() {
    const response = await api.get('/performance/reviews/team');
    return response.data;
  },

  async getReview(id: number) {
    const response = await api.get(`/performance/reviews/${id}`);
    return response.data;
  },

  async createReview(data: { campaign_id: number; employee_id: number; manager_id: number }) {
    const response = await api.post('/performance/reviews', data);
    return response.data;
  },

  async createBulkReviews(data: { campaign_id: number; employee_ids: number[] }) {
    const response = await api.post('/performance/reviews/bulk', data);
    return response.data;
  },

  async submitSelfReview(id: number, data: { self_rating: number; self_comments?: string }) {
    const response = await api.post(`/performance/reviews/${id}/self-submit`, data);
    return response.data;
  },

  async submitManagerReview(id: number, data: { manager_rating: number; manager_comments?: string; request_feedback?: boolean }) {
    const response = await api.post(`/performance/reviews/${id}/manager-submit`, data);
    return response.data;
  },

  async finalizeReview(id: number, data: { final_rating: number; final_comments?: string }) {
    const response = await api.post(`/performance/reviews/${id}/finalize`, data);
    return response.data;
  },

  async getCalculatedScore(id: number) {
    const response = await api.get(`/performance/reviews/${id}/calculated-score`);
    return response.data;
  },

  // ==================
  // OBJECTIVES
  // ==================
  async getObjectives(params?: { employee_id?: number; review_id?: number; status?: string; page?: number }) {
    const response = await api.get('/performance/objectives', { params });
    return response.data;
  },

  async getMyObjectives() {
    const response = await api.get('/performance/objectives/my');
    return response.data;
  },

  async getTeamObjectives() {
    const response = await api.get('/performance/objectives/team');
    return response.data;
  },

  async getObjective(id: number) {
    const response = await api.get(`/performance/objectives/${id}`);
    return response.data;
  },

  async createObjective(data: Partial<Objective>) {
    const response = await api.post('/performance/objectives', data);
    return response.data;
  },

  async updateObjective(id: number, data: Partial<Objective>) {
    const response = await api.patch(`/performance/objectives/${id}`, data);
    return response.data;
  },

  async updateProgress(id: number, data: { progress: number; comments?: string; current_value?: number }, asManager = false) {
    const response = await api.patch(`/performance/objectives/${id}/progress?as_manager=${asManager}`, data);
    return response.data;
  },

  async linkObjectiveToReview(id: number, reviewId: number) {
    const response = await api.post(`/performance/objectives/${id}/link-review`, { review_id: reviewId });
    return response.data;
  },

  async deleteObjective(id: number) {
    const response = await api.delete(`/performance/objectives/${id}`);
    return response.data;
  },

  async addKeyResult(objectiveId: number, data: { title: string; target_value?: number; unit?: string }) {
    const response = await api.post(`/performance/objectives/${objectiveId}/key-results`, data);
    return response.data;
  },

  async updateKeyResult(objectiveId: number, krId: number, data: Partial<KeyResult>) {
    const response = await api.patch(`/performance/objectives/${objectiveId}/key-results/${krId}`, data);
    return response.data;
  },

  async deleteKeyResult(objectiveId: number, krId: number) {
    const response = await api.delete(`/performance/objectives/${objectiveId}/key-results/${krId}`);
    return response.data;
  },

  // ==================
  // FEEDBACK 360
  // ==================
  async requestFeedback(data: { review_id: number; reviewer_ids: number[]; is_anonymous?: boolean }) {
    const response = await api.post('/performance/feedback/request', data);
    return response.data;
  },

  async getPendingFeedback() {
    const response = await api.get('/performance/feedback/pending');
    return response.data;
  },

  async getFeedbackByReview(reviewId: number) {
    const response = await api.get(`/performance/feedback/review/${reviewId}`);
    return response.data;
  },

  async getAggregatedFeedback(reviewId: number) {
    const response = await api.get(`/performance/feedback/review/${reviewId}/aggregated`);
    return response.data;
  },

  async submitFeedback(id: number, data: { rating: number; comments?: string; responses?: any }) {
    const response = await api.post(`/performance/feedback/${id}/submit`, data);
    return response.data;
  },

  async declineFeedback(id: number) {
    const response = await api.post(`/performance/feedback/${id}/decline`);
    return response.data;
  },

  async cancelFeedbackRequest(id: number) {
    const response = await api.post(`/performance/feedback/${id}/cancel`);
    return response.data;
  },

  // ==================
  // IMPROVEMENT PLANS
  // ==================
  async getImprovementPlans(params?: { employee_id?: number; manager_id?: number; status?: string; page?: number }) {
    const response = await api.get('/performance/improvement-plans', { params });
    return response.data;
  },

  async getMyImprovementPlans() {
    const response = await api.get('/performance/improvement-plans/my');
    return response.data;
  },

  async getTeamImprovementPlans() {
    const response = await api.get('/performance/improvement-plans/team');
    return response.data;
  },

  async getImprovementPlan(id: number) {
    const response = await api.get(`/performance/improvement-plans/${id}`);
    return response.data;
  },

  async createImprovementPlan(data: Partial<ImprovementPlan> & { actions?: Partial<ImprovementAction>[] }) {
    const response = await api.post('/performance/improvement-plans', data);
    return response.data;
  },

  async updateImprovementPlan(id: number, data: Partial<ImprovementPlan>) {
    const response = await api.patch(`/performance/improvement-plans/${id}`, data);
    return response.data;
  },

  async activateImprovementPlan(id: number) {
    const response = await api.post(`/performance/improvement-plans/${id}/activate`);
    return response.data;
  },

  async completeImprovementPlan(id: number) {
    const response = await api.post(`/performance/improvement-plans/${id}/complete`);
    return response.data;
  },

  async getImprovementPlanProgress(id: number) {
    const response = await api.get(`/performance/improvement-plans/${id}/progress`);
    return response.data;
  },

  async addAction(planId: number, data: Partial<ImprovementAction>) {
    const response = await api.post(`/performance/improvement-plans/${planId}/actions`, data);
    return response.data;
  },

  async updateAction(planId: number, actionId: number, data: Partial<ImprovementAction>, asManager = false) {
    const response = await api.patch(`/performance/improvement-plans/${planId}/actions/${actionId}?as_manager=${asManager}`, data);
    return response.data;
  },

  async deleteAction(planId: number, actionId: number) {
    const response = await api.delete(`/performance/improvement-plans/${planId}/actions/${actionId}`);
    return response.data;
  },

  // ==================
  // RECOGNITION
  // ==================
  async getRecognitions(params?: { from_user_id?: number; to_user_id?: number; type?: string; page?: number }) {
    const response = await api.get('/performance/recognitions', { params });
    return response.data;
  },

  async getRecognitionFeed(page = 1, limit = 20) {
    const response = await api.get('/performance/recognitions/feed', { params: { page, limit } });
    return response.data;
  },

  async getMyRecognitions() {
    const response = await api.get('/performance/recognitions/my');
    return response.data;
  },

  async getLeaderboard(period: 'week' | 'month' | 'year' = 'month', limit = 10) {
    const response = await api.get('/performance/recognitions/leaderboard', { params: { period, limit } });
    return response.data;
  },

  async getBadges(): Promise<{ success: boolean; data: Badge[] }> {
    const response = await api.get('/performance/recognitions/badges');
    return response.data;
  },

  async sendRecognition(data: { to_user_id: number; type: 'KUDOS' | 'BADGE'; badge?: string; message: string; is_public?: boolean }) {
    const response = await api.post('/performance/recognitions', data);
    return response.data;
  },

  async deleteRecognition(id: number) {
    const response = await api.delete(`/performance/recognitions/${id}`);
    return response.data;
  },
};

export default PerformanceService;
