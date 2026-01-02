import { apiClient } from './api.client';

export interface Company {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    logo_url?: string;
    website?: string;
    tax_id?: string;
    country?: string;
    currency: string;
    timezone: string;
    language: string;
    date_format?: string;
    primary_color?: string;
    secondary_color?: string;
    working_days?: string[];
    daily_work_hours?: number;
    probation_period?: number;
    fiscal_year_start?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    _count?: {
        users: number;
        departments: number;
        positions: number;
    };
}

export interface CreateCompanyDto {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
    tax_id?: string;
    country?: string;
    currency?: string;
    timezone?: string;
    language?: string;
    primary_color?: string;
    secondary_color?: string;
    working_days?: string[];
    daily_work_hours?: number;
    probation_period?: number;
    fiscal_year_start?: number;
}

export type UpdateCompanyDto = Partial<CreateCompanyDto>;

class CompaniesService {
    private readonly basePath = '/company';

    /**
     * Get all companies (Super Admin sees all, others see only their company)
     */
    async getAll(): Promise<Company[]> {
        const response = await apiClient.get(this.basePath);
        return response.data.data || [];
    }

    /**
     * Get a company by ID
     */
    async getById(id: number): Promise<Company> {
        const response = await apiClient.get(`${this.basePath}/${id}`);
        return response.data.data;
    }

    /**
     * Get current user's company
     */
    async getMyCompany(): Promise<Company> {
        const response = await apiClient.get(`${this.basePath}/me`);
        return response.data.data;
    }

    /**
     * Create a new company (Super Admin only)
     */
    async create(data: CreateCompanyDto): Promise<Company> {
        const response = await apiClient.post(this.basePath, data);
        return response.data.data;
    }

    /**
     * Update a company by ID
     */
    async update(id: number, data: UpdateCompanyDto): Promise<Company> {
        const response = await apiClient.patch(`${this.basePath}/${id}`, data);
        return response.data.data;
    }

    /**
     * Update current user's company
     */
    async updateMyCompany(data: UpdateCompanyDto): Promise<Company> {
        const response = await apiClient.patch(`${this.basePath}/me`, data);
        return response.data.data;
    }

    /**
     * Deactivate a company (Super Admin only)
     */
    async deactivate(id: number): Promise<Company> {
        const response = await apiClient.delete(`${this.basePath}/${id}`);
        return response.data.data;
    }

    /**
     * Reactivate a company (Super Admin only)
     */
    async reactivate(id: number): Promise<Company> {
        const response = await apiClient.post(`${this.basePath}/${id}/reactivate`);
        return response.data.data;
    }

    /**
     * Upload logo for a company
     */
    async uploadLogo(id: number, file: File): Promise<Company> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post(`${this.basePath}/${id}/logo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.data;
    }

    /**
     * Upload logo for current user's company
     */
    async uploadMyCompanyLogo(file: File): Promise<Company> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post(`${this.basePath}/me/logo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.data;
    }
}

export const companiesService = new CompaniesService();
export default companiesService;
