import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export enum ContractType {
  CDI = 'CDI',
  CDD = 'CDD',
  INTERIM = 'INTERIM',
  STAGE = 'STAGE',
  APPRENTISSAGE = 'APPRENTISSAGE',
  FREELANCE = 'FREELANCE',
  OTHER = 'OTHER',
}

export enum ContractStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
  EXPIRED = 'EXPIRED',
}

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  [ContractType.CDI]: 'CDI',
  [ContractType.CDD]: 'CDD',
  [ContractType.INTERIM]: 'Intérim',
  [ContractType.STAGE]: 'Stage',
  [ContractType.APPRENTISSAGE]: 'Apprentissage',
  [ContractType.FREELANCE]: 'Freelance',
  [ContractType.OTHER]: 'Autre',
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  [ContractStatus.DRAFT]: 'Brouillon',
  [ContractStatus.ACTIVE]: 'Actif',
  [ContractStatus.SUSPENDED]: 'Suspendu',
  [ContractStatus.TERMINATED]: 'Terminé',
  [ContractStatus.EXPIRED]: 'Expiré',
};

export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  [ContractStatus.DRAFT]: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  [ContractStatus.ACTIVE]: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  [ContractStatus.SUSPENDED]: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
  [ContractStatus.TERMINATED]: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  [ContractStatus.EXPIRED]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
};

export interface Contract {
  id: number;
  user_id: number;
  contract_type: ContractType;
  start_date: string;
  end_date?: string;
  salary?: number;
  salary_currency: string;
  working_hours?: number;
  probation_end?: string;
  status: ContractStatus;
  document_url?: string;
  notes?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    full_name: string;
    work_email?: string;
    profile_photo_url?: string;
    position?: { title: string };
    department_user_department_idTodepartment?: { name: string };
  };
  creator?: {
    id: number;
    full_name: string;
  };
}

export interface CreateContractDto {
  user_id: number;
  contract_type: ContractType;
  start_date: string;
  end_date?: string;
  salary?: number;
  salary_currency?: string;
  working_hours?: number;
  probation_end?: string;
  status?: ContractStatus;
  document_url?: string;
  notes?: string;
}

export interface ContractStats {
  total: number;
  byType: { type: ContractType; count: number }[];
  byStatus: { status: ContractStatus; count: number }[];
  expiringSoon: number;
}

class ContractsService {
  private getAuthHeaders() {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getAll(params?: {
    user_id?: number;
    status?: ContractStatus;
    contract_type?: ContractType;
    expiring_soon?: boolean;
  }): Promise<Contract[]> {
    const queryParams = new URLSearchParams();
    if (params?.user_id) queryParams.append('user_id', params.user_id.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.contract_type) queryParams.append('contract_type', params.contract_type);
    if (params?.expiring_soon) queryParams.append('expiring_soon', 'true');

    const response = await axios.get(
      `${API_BASE_URL}/contracts?${queryParams.toString()}`,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async getById(id: number): Promise<Contract> {
    const response = await axios.get(
      `${API_BASE_URL}/contracts/${id}`,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async getByUser(userId: number): Promise<Contract[]> {
    const response = await axios.get(
      `${API_BASE_URL}/contracts/user/${userId}`,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async getExpiring(): Promise<Contract[]> {
    const response = await axios.get(
      `${API_BASE_URL}/contracts/expiring`,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async getStats(): Promise<ContractStats> {
    const response = await axios.get(
      `${API_BASE_URL}/contracts/stats`,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async create(data: CreateContractDto): Promise<Contract> {
    const response = await axios.post(
      `${API_BASE_URL}/contracts`,
      data,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async update(id: number, data: Partial<CreateContractDto>): Promise<Contract> {
    const response = await axios.patch(
      `${API_BASE_URL}/contracts/${id}`,
      data,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async terminate(id: number, notes?: string): Promise<Contract> {
    const response = await axios.patch(
      `${API_BASE_URL}/contracts/${id}/terminate`,
      { notes },
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/contracts/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }
}

export const contractsService = new ContractsService();
