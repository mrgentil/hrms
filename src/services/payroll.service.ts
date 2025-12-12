import { apiClient } from './api.client';
import type {
    Payslip,
    CreatePayslipDto,
    UpdatePayslipDto,
    SalaryAdvance,
    CreateAdvanceDto,
    UpdateAdvanceDto,
    ReviewAdvanceDto,
    Bonus,
    CreateBonusDto,
    UpdateBonusDto,
    ReviewBonusDto,
    BenefitCatalog,
    EmployeeBenefit,
    CreateBenefitCatalogDto,
    UpdateBenefitCatalogDto,
    EnrollBenefitDto,
    ApiResponse,
    PaginatedResponse,
    PayrollStats,
} from '@/types/payroll.types';

// ========================================
// PAYSLIP SERVICE
// ========================================

export const payslipService = {
    /**
     * Get all payslips with optional filters
     */
    getPayslips: async (params?: {
        page?: number;
        limit?: number;
        month?: number;
        year?: number;
        user_id?: number;
        status?: string;
    }): Promise<PaginatedResponse<Payslip>> => {
        const response = await apiClient.get('/payroll/payslips', { params });
        return response.data;
    },

    /**
     * Get a single payslip by ID
     */
    getPayslip: async (id: number): Promise<ApiResponse<Payslip>> => {
        const response = await apiClient.get(`/payroll/payslips/${id}`);
        return response.data;
    },

    /**
     * Get current user's payslips
     */
    getMyPayslips: async (params?: {
        page?: number;
        limit?: number;
        year?: number;
    }): Promise<PaginatedResponse<Payslip>> => {
        const response = await apiClient.get('/payroll/payslips/my', { params });
        return response.data;
    },

    /**
     * Create/generate a new payslip
     */
    createPayslip: async (data: CreatePayslipDto): Promise<ApiResponse<Payslip>> => {
        const response = await apiClient.post('/payroll/payslips', data);
        return response.data;
    },

    /**
     * Update payslip status or notes
     */
    updatePayslip: async (id: number, data: UpdatePayslipDto): Promise<ApiResponse<Payslip>> => {
        const response = await apiClient.patch(`/payroll/payslips/${id}`, data);
        return response.data;
    },

    /**
     * Publish a payslip (make it available to employee)
     */
    publishPayslip: async (id: number): Promise<ApiResponse<Payslip>> => {
        const response = await apiClient.post(`/payroll/payslips/${id}/publish`);
        return response.data;
    },

    /**
     * Download payslip PDF
     */
    downloadPDF: async (id: number): Promise<Blob> => {
        const response = await apiClient.get(`/payroll/payslips/${id}/pdf`, {
            responseType: 'blob',
        });
        return response.data;
    },

    /**
     * Delete a payslip
     */
    deletePayslip: async (id: number): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete(`/payroll/payslips/${id}`);
        return response.data;
    },
};

// ========================================
// SALARY ADVANCE SERVICE
// ========================================

export const advanceService = {
    /**
     * Get all salary advances with filters
     */
    getAdvances: async (params?: {
        page?: number;
        limit?: number;
        user_id?: number;
        status?: string;
    }): Promise<PaginatedResponse<SalaryAdvance>> => {
        const response = await apiClient.get('/payroll/advances', { params });
        return response.data;
    },

    /**
     * Get a single advance by ID
     */
    getAdvance: async (id: number): Promise<ApiResponse<SalaryAdvance>> => {
        const response = await apiClient.get(`/payroll/advances/${id}`);
        return response.data;
    },

    /**
     * Get current user's advances
     */
    getMyAdvances: async (): Promise<ApiResponse<SalaryAdvance[]>> => {
        const response = await apiClient.get('/payroll/advances/my');
        return response.data;
    },

    /**
     * Create a new salary advance request
     */
    createAdvance: async (data: CreateAdvanceDto): Promise<ApiResponse<SalaryAdvance>> => {
        const response = await apiClient.post('/payroll/advances', data);
        return response.data;
    },

    /**
     * Update an advance request (only in DRAFT status)
     */
    updateAdvance: async (id: number, data: UpdateAdvanceDto): Promise<ApiResponse<SalaryAdvance>> => {
        const response = await apiClient.patch(`/payroll/advances/${id}`, data);
        return response.data;
    },

    /**
     * Submit an advance for approval
     */
    submitAdvance: async (id: number): Promise<ApiResponse<SalaryAdvance>> => {
        const response = await apiClient.post(`/payroll/advances/${id}/submit`);
        return response.data;
    },

    /**
     * Review an advance (approve/reject)
     */
    reviewAdvance: async (id: number, data: ReviewAdvanceDto): Promise<ApiResponse<SalaryAdvance>> => {
        const response = await apiClient.post(`/payroll/advances/${id}/review`, data);
        return response.data;
    },

    /**
     * Cancel an advance request
     */
    cancelAdvance: async (id: number): Promise<ApiResponse<SalaryAdvance>> => {
        const response = await apiClient.post(`/payroll/advances/${id}/cancel`);
        return response.data;
    },

    /**
     * Delete an advance request
     */
    deleteAdvance: async (id: number): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete(`/payroll/advances/${id}`);
        return response.data;
    },
};

// ========================================
// BONUS SERVICE
// ========================================

export const bonusService = {
    /**
     * Get all bonuses with filters
     */
    getBonuses: async (params?: {
        page?: number;
        limit?: number;
        user_id?: number;
        status?: string;
        bonus_type?: string;
    }): Promise<PaginatedResponse<Bonus>> => {
        const response = await apiClient.get('/payroll/bonuses', { params });
        return response.data;
    },

    /**
     * Get a single bonus by ID
     */
    getBonus: async (id: number): Promise<ApiResponse<Bonus>> => {
        const response = await apiClient.get(`/payroll/bonuses/${id}`);
        return response.data;
    },

    /**
     * Get current user's bonuses
     */
    getMyBonuses: async (): Promise<ApiResponse<Bonus[]>> => {
        const response = await apiClient.get('/payroll/bonuses/my');
        return response.data;
    },

    /**
     * Create a new bonus
     */
    createBonus: async (data: CreateBonusDto): Promise<ApiResponse<Bonus>> => {
        const response = await apiClient.post('/payroll/bonuses', data);
        return response.data;
    },

    /**
     * Update a bonus (only in DRAFT status)
     */
    updateBonus: async (id: number, data: UpdateBonusDto): Promise<ApiResponse<Bonus>> => {
        const response = await apiClient.patch(`/payroll/bonuses/${id}`, data);
        return response.data;
    },

    /**
     * Submit a bonus for approval
     */
    submitBonus: async (id: number): Promise<ApiResponse<Bonus>> => {
        const response = await apiClient.post(`/payroll/bonuses/${id}/submit`);
        return response.data;
    },

    /**
     * Review a bonus (approve/reject)
     */
    reviewBonus: async (id: number, data: ReviewBonusDto): Promise<ApiResponse<Bonus>> => {
        const response = await apiClient.post(`/payroll/bonuses/${id}/review`, data);
        return response.data;
    },

    /**
     * Cancel a bonus
     */
    cancelBonus: async (id: number): Promise<ApiResponse<Bonus>> => {
        const response = await apiClient.post(`/payroll/bonuses/${id}/cancel`);
        return response.data;
    },

    /**
     * Delete a bonus
     */
    deleteBonus: async (id: number): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete(`/payroll/bonuses/${id}`);
        return response.data;
    },
};

// ========================================
// BENEFIT SERVICE
// ========================================

export const benefitService = {
    /**
     * Get all benefits from catalog
     */
    getBenefits: async (params?: {
        page?: number;
        limit?: number;
        benefit_type?: string;
        is_active?: boolean;
    }): Promise<PaginatedResponse<BenefitCatalog>> => {
        const response = await apiClient.get('/payroll/benefits/catalog', { params });
        return response.data;
    },

    /**
     * Get a single benefit from catalog
     */
    getBenefit: async (id: number): Promise<ApiResponse<BenefitCatalog>> => {
        const response = await apiClient.get(`/payroll/benefits/catalog/${id}`);
        return response.data;
    },

    /**
     * Create a new benefit in catalog (admin only)
     */
    createBenefit: async (data: CreateBenefitCatalogDto): Promise<ApiResponse<BenefitCatalog>> => {
        const response = await apiClient.post('/payroll/benefits/catalog', data);
        return response.data;
    },

    /**
     * Update a benefit in catalog (admin only)
     */
    updateBenefit: async (id: number, data: UpdateBenefitCatalogDto): Promise<ApiResponse<BenefitCatalog>> => {
        const response = await apiClient.patch(`/payroll/benefits/catalog/${id}`, data);
        return response.data;
    },

    /**
     * Delete a benefit from catalog (admin only)
     */
    deleteBenefit: async (id: number): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete(`/payroll/benefits/catalog/${id}`);
        return response.data;
    },

    /**
     * Get current user's enrolled benefits
     */
    getMyBenefits: async (): Promise<ApiResponse<EmployeeBenefit[]>> => {
        const response = await apiClient.get('/payroll/benefits/my');
        return response.data;
    },

    /**
     * Get all employee benefit enrollments (admin only)
     */
    getAllEnrollments: async (params?: {
        page?: number;
        limit?: number;
        user_id?: number;
        benefit_id?: number;
        status?: string;
    }): Promise<PaginatedResponse<EmployeeBenefit>> => {
        const response = await apiClient.get('/payroll/benefits/enrollments', { params });
        return response.data;
    },

    /**
     * Enroll in a benefit
     */
    enrollBenefit: async (data: EnrollBenefitDto): Promise<ApiResponse<EmployeeBenefit>> => {
        const response = await apiClient.post('/payroll/benefits/enroll', data);
        return response.data;
    },

    /**
     * Cancel/terminate a benefit enrollment
     */
    terminateEnrollment: async (id: number): Promise<ApiResponse<EmployeeBenefit>> => {
        const response = await apiClient.post(`/payroll/benefits/enrollments/${id}/terminate`);
        return response.data;
    },
};

// ========================================
// STATS SERVICE
// ========================================

export const payrollStatsService = {
    /**
     * Get payroll statistics
     */
    getStats: async (): Promise<ApiResponse<PayrollStats>> => {
        const response = await apiClient.get('/payroll/stats');
        return response.data;
    },
};

// Export all services
export const payrollService = {
    payslips: payslipService,
    advances: advanceService,
    bonuses: bonusService,
    benefits: benefitService,
    stats: payrollStatsService,
};
