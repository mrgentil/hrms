import axios from 'axios';
import { authService } from '@/lib/auth';
import { resolveImageUrl } from '@/lib/images';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Types
export interface Employee {
  id: number;
  username: string;
  full_name: string;
  role: string;
  role_id?: number;
  active: boolean;
  department_id?: number;
  work_email?: string;
  hire_date?: string;
  termination_date?: string;
  profile_photo_url?: string | null;
  manager_user_id?: number;
  position_id?: number;
  created_at: string;
  updated_at: string;

  // Relations
  department?: {
    id: number;
    name: string;
  };
  position?: {
    id: number;
    title: string;
    level?: string;
    description?: string;
  };
  role_relation?: {
    id: number;
    name: string;
    color?: string;
    icon?: string;
    description?: string;
  };
  user_personal_info?: PersonalInfo[];
  user_financial_info?: FinancialInfo[];
  employment_contract?: Contract[];
  user_document_user_document_user_idTouser?: Document[];
  user_employment_history?: EmploymentHistory[];
  user?: {
    id: number;
    full_name: string;
  };
  other_user?: {
    id: number;
    full_name: string;
  }[];
}

export interface PersonalInfo {
  id: number;
  date_of_birth?: string;
  gender?: 'Male' | 'Female';
  marital_status?: 'Married' | 'Single' | 'Widowed';
  father_name?: string;
  id_number?: string;
  address?: string;
  city?: string;
  country?: string;
  mobile?: string;
  phone?: string;
  email_address?: string;
  spouse_name?: string;
  emergency_contact_primary_name?: string;
  emergency_contact_primary_phone?: string;
  emergency_contact_primary_relation?: string;
  emergency_contact_secondary_name?: string;
  emergency_contact_secondary_phone?: string;
  emergency_contact_secondary_relation?: string;
  user_id: number;
}

export interface FinancialInfo {
  id: number;
  employment_type?: 'Full_Time' | 'Part_Time';
  salary_basic?: number;
  salary_gross?: number;
  salary_net?: number;
  allowance_house_rent?: number;
  allowance_medical?: number;
  allowance_special?: number;
  allowance_fuel?: number;
  allowance_phone_bill?: number;
  allowance_other?: number;
  allowance_total?: number;
  deduction_provident_fund?: number;
  deduction_tax?: number;
  deduction_other?: number;
  deduction_total?: number;
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  iban?: string;
  user_id: number;
}

export interface Contract {
  id: number;
  contract_type: 'PERMANENT' | 'FIXED_TERM' | 'INTERNSHIP' | 'CONTRACTOR';
  start_date: string;
  end_date?: string;
  probation_end_date?: string;
  status: 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  weekly_hours?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  user_id: number;
}

export interface Document {
  id: number;
  name: string;
  document_type?: string;
  file_path: string;
  is_confidential: boolean;
  description?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  uploaded_by_user_id: number;
  user_user_document_uploaded_by_user_idTouser?: {
    id: number;
    full_name: string;
  };
}

export interface EmploymentHistory {
  id: number;
  change_type: string;
  effective_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  user_id: number;
}

export interface TaskAssignment {
  id: number;
  role?: string;
  assigned_at: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE' | 'ARCHIVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  start_date?: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  project?: {
    id: number;
    name: string;
  };
  task_column?: {
    id: number;
    name: string;
  };
  task_assignment: TaskAssignment[];
  user_task_created_by_user_idTouser?: {
    id: number;
    full_name: string;
  };
}

export interface UpdateMyTaskPayload {
  status?: Task['status'];
  completed_at?: string | null;
}

export interface TeamMember {
  id: number;
  full_name: string;
  work_email?: string | null;
  profile_photo_url?: string | null;
  active: boolean;
  hire_date?: string | null;
  position?: {
    id: number;
    title: string;
    level?: string | null;
  } | null;
  department?: {
    id: number;
    name: string;
  } | null;
}

export interface TeamStats {
  totalTeamMembers: number;
  activeTeamMembers: number;
  inactiveTeamMembers: number;
  pendingLeaves: number;
  upcomingLeaves: number;
  openTasks: number;
}

export interface UpdateMyProfilePayload {
  full_name?: string;
  work_email?: string;
  date_of_birth?: string;
  gender?: 'Male' | 'Female';
  marital_status?: 'Married' | 'Single' | 'Widowed';
  id_number?: string;
  address?: string;
  city?: string;
  country?: string;
  mobile?: string;
  phone?: string;
  email_address?: string;
  spouse_name?: string;
  emergency_contact_primary_name?: string;
  emergency_contact_primary_relation?: string;
  emergency_contact_primary_phone?: string;
  emergency_contact_secondary_name?: string;
  emergency_contact_secondary_relation?: string;
  emergency_contact_secondary_phone?: string;
}

export interface CreateEmployeeData {
  username: string;
  password: string;
  full_name: string;
  role?: string;
  role_id?: number;
  department_id?: number;
  position_id?: number;
  manager_user_id?: number;
  work_email?: string;
  hire_date?: string;
  profile_photo_url?: string;
  active?: boolean;

  // Personal info
  date_of_birth?: string;
  gender?: 'Male' | 'Female';
  marital_status?: 'Married' | 'Single' | 'Widowed';
  father_name?: string;
  id_number?: string;
  address?: string;
  city?: string;
  country?: string;
  mobile?: string;
  phone?: string;
  email_address?: string;

  // Financial info
  employment_type?: 'Full_Time' | 'Part_Time';
  salary_basic?: number;
  salary_gross?: number;
  salary_net?: number;
  allowance_house_rent?: number;
  allowance_medical?: number;
  allowance_special?: number;
  allowance_fuel?: number;
  allowance_phone_bill?: number;
  allowance_other?: number;
  deduction_provident_fund?: number;
  deduction_tax?: number;
  deduction_other?: number;
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  iban?: string;
}

export interface CreateContractData {
  contract_type: 'PERMANENT' | 'FIXED_TERM' | 'INTERNSHIP' | 'CONTRACTOR';
  start_date: string;
  end_date?: string;
  probation_end_date?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  weekly_hours?: number;
  notes?: string;
}

export interface CreateDocumentData {
  name: string;
  document_type?: string;
  file_path: string;
  is_confidential?: boolean;
  description?: string;
  expires_at?: string;
}

// API Service
class EmployeesService {
  private getToken(): string | null {
    const accessToken = authService.getAccessToken();
    if (accessToken) {
      return accessToken;
    }

    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private getAuthHeaders(contentType: string | null = 'application/json') {
    const token = this.getToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    return headers;
  }

  private getMultipartHeaders() {
    return this.getAuthHeaders(null);
  }

  private normalizeEmployee(employee: Employee): Employee {
    return {
      ...employee,
      profile_photo_url: resolveImageUrl(employee.profile_photo_url) ?? null,
    };
  }

  private normalizeEmployeePayload(responseData: any) {
    if (!responseData || responseData.data === undefined) {
      return responseData;
    }

    const payload = responseData.data;

    if (Array.isArray(payload)) {
      return {
        ...responseData,
        data: payload.map((item) =>
          item && typeof item === 'object' && 'profile_photo_url' in item
            ? this.normalizeEmployee(item as Employee)
            : item,
        ),
      };
    }

    if (payload && typeof payload === 'object' && 'profile_photo_url' in payload) {
      return {
        ...responseData,
        data: this.normalizeEmployee(payload as Employee),
      };
    }

    return responseData;
  }

  // Employees CRUD
  async getEmployees(params?: {
    page?: number;
    limit?: number;
    search?: string;
    department_id?: number;
  }) {
    const response = await axios.get(`${API_BASE_URL}/employees`, {
      headers: this.getAuthHeaders(),
      params,
    });
    return this.normalizeEmployeePayload(response.data);
  }

  async getAllEmployees() {
    // Fetch all active employees (using a high limit for simplicity)
    const response = await axios.get(`${API_BASE_URL}/employees`, {
      headers: this.getAuthHeaders(),
      params: { limit: 1000 },
    });
    const normalized = this.normalizeEmployeePayload(response.data);
    return normalized.data || [];
  }

  async getEmployee(id: number) {
    const response = await axios.get(`${API_BASE_URL}/employees/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async createEmployee(data: CreateEmployeeData) {
    const response = await axios.post(`${API_BASE_URL}/employees`, data, {
      headers: this.getAuthHeaders(),
    });
    return this.normalizeEmployeePayload(response.data);
  }

  async updateEmployee(id: number, data: Partial<CreateEmployeeData>) {
    const response = await axios.patch(`${API_BASE_URL}/employees/${id}`, data, {
      headers: this.getAuthHeaders(),
    });
    return this.normalizeEmployeePayload(response.data);
  }

  async deleteEmployee(id: number) {
    const response = await axios.delete(`${API_BASE_URL}/employees/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getEmployeeStats() {
    const response = await axios.get(`${API_BASE_URL}/employees/stats`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async searchEmployees(query: string) {
    const response = await axios.get(`${API_BASE_URL}/employees/search`, {
      headers: this.getAuthHeaders(),
      params: { q: query },
    });
    return this.normalizeEmployeePayload(response.data);
  }

  async getOrganizationChart() {
    const response = await axios.get(`${API_BASE_URL}/employees/organization-chart`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getMyProfile() {
    const response = await axios.get(`${API_BASE_URL}/employees/my-profile`, {
      headers: this.getAuthHeaders(),
    });
    return this.normalizeEmployeePayload(response.data);
  }

  async updateMyProfile(data: UpdateMyProfilePayload, profilePhoto?: File | null) {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const stringValue = typeof value === 'string' ? value.trim() : value;
        if (stringValue !== '') {
          formData.append(key, stringValue as string);
        }
      }
    });

    if (profilePhoto) {
      formData.append('profile_photo', profilePhoto);
    }

    const response = await axios.patch(`${API_BASE_URL}/employees/my-profile`, formData, {
      headers: this.getAuthHeaders(null),
    });
    return this.normalizeEmployeePayload(response.data);
  }

  // Contracts
  async getEmployeeContracts(employeeId: number) {
    const response = await axios.get(`${API_BASE_URL}/employees/${employeeId}/contracts`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async createContract(employeeId: number, data: CreateContractData) {
    const response = await axios.post(`${API_BASE_URL}/employees/${employeeId}/contracts`, data, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async updateContract(contractId: number, data: Partial<CreateContractData>) {
    const response = await axios.patch(`${API_BASE_URL}/employees/contracts/${contractId}`, data, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async deleteContract(contractId: number) {
    const response = await axios.delete(`${API_BASE_URL}/employees/contracts/${contractId}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  // Documents
  async getEmployeeDocuments(employeeId: number) {
    const response = await axios.get(`${API_BASE_URL}/employees/${employeeId}/documents`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getMyDocuments() {
    const response = await axios.get(`${API_BASE_URL}/employees/my-documents`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getMyProjects() {
    const response = await axios.get(`${API_BASE_URL}/employees/my-projects`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getMyTasks() {
    const response = await axios.get(`${API_BASE_URL}/employees/my-tasks`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async updateMyTask(taskId: number, data: UpdateMyTaskPayload) {
    // Utiliser le nouvel endpoint qui met aussi à jour la colonne Kanban
    if (data.status !== undefined) {
      const response = await axios.patch(
        `${API_BASE_URL}/tasks/my-tasks/${taskId}/status`,
        { status: data.status },
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    }

    // Fallback pour les autres mises à jour
    const payload: Record<string, unknown> = {};
    if (data.completed_at !== undefined) {
      payload.completed_at = data.completed_at;
    }

    const response = await axios.patch(`${API_BASE_URL}/employees/my-tasks/${taskId}`, payload, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getMyTeam() {
    const response = await axios.get(`${API_BASE_URL}/employees/my-team`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getMyTeamTasks() {
    const response = await axios.get(`${API_BASE_URL}/employees/my-team/tasks`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getMyTeamStats() {
    const response = await axios.get(`${API_BASE_URL}/employees/my-team/stats`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getMyEmploymentHistory() {
    const response = await axios.get(`${API_BASE_URL}/employees/my-employment-history`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getMyAnnouncements() {
    const response = await axios.get(`${API_BASE_URL}/employees/my-announcements`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async createDocument(employeeId: number, formData: FormData) {
    const response = await axios.post(`${API_BASE_URL}/employees/${employeeId}/documents`, formData, {
      headers: this.getMultipartHeaders(),
    });
    return response.data;
  }

  async deleteDocument(documentId: number) {
    const response = await axios.delete(`${API_BASE_URL}/employees/documents/${documentId}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }
}

export const employeesService = new EmployeesService();
