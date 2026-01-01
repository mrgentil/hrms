// Payroll TypeScript Types and Interfaces

// ========================================
// PAYSLIP TYPES
// ========================================

export enum PayslipStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    SENT = 'SENT',
    ARCHIVED = 'ARCHIVED',
}

export interface PayslipBreakdown {
    name: string;
    amount: number;
}

export interface Payslip {
    id: number;
    user_id: number;
    month: number;
    year: number;
    salary_basic: number;
    salary_gross: number;
    salary_net: number;
    allowances_total: number;
    deductions_total: number;
    bonuses_total?: number;
    advances_deducted?: number;

    allowances_breakdown?: PayslipBreakdown[];
    deductions_breakdown?: PayslipBreakdown[];
    bonuses_breakdown?: PayslipBreakdown[];

    status: PayslipStatus;
    generated_by: number;
    generated_at: Date;
    published_at?: Date;
    pdf_path?: string;
    notes?: string;

    created_at: Date;
    updated_at: Date;

    // Relations
    user?: {
        id: number;
        full_name: string;
        work_email?: string;
    };
    generator?: {
        id: number;
        full_name: string;
    };
}

export interface CreatePayslipDto {
    user_id: number;
    month: number;
    year: number;
    notes?: string;
}

export interface UpdatePayslipDto {
    status?: PayslipStatus;
    notes?: string;
}

// ========================================
// SALARY ADVANCE TYPES
// ========================================

export enum AdvanceStatus {
    DRAFT = 'DRAFT',
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    PAID = 'PAID',
    REPAYING = 'REPAYING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export interface AdvanceRepayment {
    id: number;
    advance_id: number;
    payslip_month: number;
    payslip_year: number;
    amount: number;
    deducted_at: Date;
}

export interface SalaryAdvance {
    id: number;
    user_id: number;
    amount: number;
    reason: string;
    requested_date: Date;
    needed_by_date?: Date;

    status: AdvanceStatus;
    submitted_at?: Date;
    reviewed_by?: number;
    reviewed_at?: Date;
    reviewer_comment?: string;

    repayment_months?: number;
    monthly_deduction?: number;
    total_repaid: number;
    repayment_start?: Date;
    fully_repaid_at?: Date;

    paid_at?: Date;
    payment_method?: string;
    payment_reference?: string;

    created_at: Date;
    updated_at: Date;

    // Relations
    user?: {
        id: number;
        full_name: string;
        work_email?: string;
        department?: {
            name: string;
        };
    };
    reviewer?: {
        id: number;
        full_name: string;
    };
    repayments?: AdvanceRepayment[];
}

export interface CreateAdvanceDto {
    amount: number;
    reason: string;
    needed_by_date?: string;
    repayment_months?: number;
}

export interface UpdateAdvanceDto {
    amount?: number;
    reason?: string;
    needed_by_date?: string;
    repayment_months?: number;
}

export interface ReviewAdvanceDto {
    status: AdvanceStatus.APPROVED | AdvanceStatus.REJECTED;
    reviewer_comment?: string;
}

// ========================================
// FUND REQUEST TYPES
// ========================================

export enum FundRequestStatus {
    DRAFT = 'DRAFT',
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    PAID = 'PAID',
    CANCELLED = 'CANCELLED',
}

export interface FundRequest {
    id: number;
    user_id: number;
    amount: number;
    reason: string;
    project?: string;
    department?: string;
    needed_by?: Date;

    status: FundRequestStatus;
    submitted_at?: Date;
    reviewed_by?: number;
    reviewed_at?: Date;
    reviewer_comment?: string;

    paid_at?: Date;
    payment_method?: string;
    payment_ref?: string;

    created_at: Date;
    updated_at: Date;

    // Relations
    user?: {
        id: number;
        full_name: string;
        work_email?: string;
        department?: {
            name: string;
        };
    };
    reviewer?: {
        id: number;
        full_name: string;
    };
}

export interface CreateFundRequestDto {
    amount: number;
    reason: string;
    project?: string;
    department?: string;
    needed_by?: string;
}

export interface UpdateFundRequestDto {
    amount?: number;
    reason?: string;
    project?: string;
    department?: string;
    needed_by?: string;
}

export interface ReviewFundRequestDto {
    status: FundRequestStatus.APPROVED | FundRequestStatus.REJECTED;
    reviewer_comment?: string;
}

export interface MarkAsPaidDto {
    payment_method?: string;
    payment_ref?: string;
}

// ========================================
// BONUS TYPES
// ========================================

export enum BonusType {
    PERFORMANCE = 'PERFORMANCE',
    ANNUAL = 'ANNUAL',
    EXCEPTIONAL = 'EXCEPTIONAL',
    PROJECT_COMPLETION = 'PROJECT_COMPLETION',
    RETENTION = 'RETENTION',
    REFERRAL = 'REFERRAL',
}

export enum BonusStatus {
    DRAFT = 'DRAFT',
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    PAID = 'PAID',
    CANCELLED = 'CANCELLED',
}

export interface Bonus {
    id: number;
    user_id: number;
    bonus_type: BonusType;
    amount: number;
    title: string;
    description?: string;
    period?: string;

    status: BonusStatus;
    created_by: number;
    submitted_at?: Date;
    approved_by?: number;
    approved_at?: Date;
    approver_comment?: string;

    payslip_month?: number;
    payslip_year?: number;
    paid_at?: Date;

    created_at: Date;
    updated_at: Date;

    // Relations
    user?: {
        id: number;
        full_name: string;
        work_email?: string;
    };
    creator?: {
        id: number;
        full_name: string;
    };
    approver?: {
        id: number;
        full_name: string;
    };
}

export interface CreateBonusDto {
    user_id: number;
    bonus_type: BonusType;
    amount: number;
    title: string;
    description?: string;
    period?: string;
}

export interface UpdateBonusDto {
    bonus_type?: BonusType;
    amount?: number;
    title?: string;
    description?: string;
    period?: string;
}

export interface ReviewBonusDto {
    status: BonusStatus.APPROVED | BonusStatus.REJECTED;
    approver_comment?: string;
}

// ========================================
// BENEFIT TYPES
// ========================================

export enum BenefitType {
    HEALTH_INSURANCE = 'HEALTH_INSURANCE',
    MEAL_VOUCHERS = 'MEAL_VOUCHERS',
    TRANSPORT = 'TRANSPORT',
    PHONE = 'PHONE',
    GYM = 'GYM',
    TRAINING = 'TRAINING',
    REMOTE_WORK = 'REMOTE_WORK',
    OTHER = 'OTHER',
}

export enum BenefitValueType {
    FIXED = 'FIXED',
    PERCENTAGE = 'PERCENTAGE',
}

export enum BenefitEnrollmentStatus {
    PENDING = 'PENDING',
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    TERMINATED = 'TERMINATED',
}

export interface BenefitCatalog {
    id: number;
    name: string;
    description: string;
    benefit_type: BenefitType;
    value_type: BenefitValueType;
    value_amount?: number;
    value_percentage?: number;

    is_active: boolean;
    requires_enrollment: boolean;
    eligibility_rules?: Record<string, any>;

    employer_contribution?: number;
    employee_contribution?: number;

    created_at: Date;
    updated_at: Date;

    enrollments?: EmployeeBenefit[];
}

export interface EmployeeBenefit {
    id: number;
    user_id: number;
    benefit_id: number;

    enrolled_at: Date;
    start_date: Date;
    end_date?: Date;
    status: BenefitEnrollmentStatus;

    custom_value?: number;
    last_used_at?: Date;
    usage_count: number;
    notes?: string;

    created_at: Date;
    updated_at: Date;

    // Relations
    user?: {
        id: number;
        full_name: string;
    };
    benefit?: BenefitCatalog;
}

export interface CreateBenefitCatalogDto {
    name: string;
    description: string;
    benefit_type: BenefitType;
    value_type: BenefitValueType;
    value_amount?: number;
    value_percentage?: number;
    requires_enrollment?: boolean;
    eligibility_rules?: Record<string, any>;
    employer_contribution?: number;
    employee_contribution?: number;
}

export interface UpdateBenefitCatalogDto {
    name?: string;
    description?: string;
    is_active?: boolean;
    value_amount?: number;
    value_percentage?: number;
    employer_contribution?: number;
    employee_contribution?: number;
}

export interface EnrollBenefitDto {
    benefit_id: number;
    start_date: string;
    custom_value?: number;
}

// ========================================
// API RESPONSE TYPES
// ========================================

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PayrollStats {
    totalPayslips: number;
    totalAdvances: number;
    totalBonuses: number;
    totalBenefits: number;
    pendingAdvances: number;
    pendingBonuses: number;
    activeEnrollments: number;
}
