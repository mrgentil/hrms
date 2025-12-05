import { authService } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Department {
  id: number;
  department_name: string;
  description?: string;
  manager_id?: number;
  parent_id?: number;
  created_at: string;
  updated_at: string;
  manager?: {
    id: number;
    full_name: string;
  };
  _count?: {
    users: number;
  };
}

class DepartmentsService {
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await authService.authenticatedFetch(url, options);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur serveur' }));
      throw new Error(error.message || 'Erreur lors de la requête');
    }
    return response.json();
  }

  // Récupérer tous les départements
  async getDepartments(): Promise<Department[]> {
    const result = await this.request<any>(`${API_BASE_URL}/departments`);
    return result.data || result;
  }

  // Récupérer un département
  async getDepartment(id: number): Promise<Department> {
    const result = await this.request<any>(`${API_BASE_URL}/departments/${id}`);
    return result.data || result;
  }

  // Créer un département
  async createDepartment(data: Partial<Department>): Promise<Department> {
    const result = await this.request<any>(`${API_BASE_URL}/departments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data || result;
  }

  // Mettre à jour un département
  async updateDepartment(id: number, data: Partial<Department>): Promise<Department> {
    const result = await this.request<any>(`${API_BASE_URL}/departments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return result.data || result;
  }

  // Supprimer un département
  async deleteDepartment(id: number): Promise<void> {
    await this.request<any>(`${API_BASE_URL}/departments/${id}`, {
      method: 'DELETE',
    });
  }
}

export const departmentsService = new DepartmentsService();
