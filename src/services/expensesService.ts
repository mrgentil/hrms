import { authService } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type ExpenseCategory = 
  | 'TRANSPORT'
  | 'MEALS'
  | 'ACCOMMODATION'
  | 'OFFICE_SUPPLIES'
  | 'EQUIPMENT'
  | 'TRAINING'
  | 'TRAVEL'
  | 'CLIENT_ENTERTAINMENT'
  | 'COMMUNICATION'
  | 'OTHER';

export type ExpenseStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CANCELLED';

export interface ExpenseReport {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  expense_date: string;
  receipt_url: string | null;
  status: ExpenseStatus;
  submitted_at: string | null;
  approved_by: number | null;
  approved_at: string | null;
  rejected_reason: string | null;
  payment_date: string | null;
  payment_ref: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    full_name: string;
    work_email?: string;
    department_user_department_idTodepartment?: {
      department_name: string;
    };
  };
  approver?: {
    id: number;
    full_name: string;
  } | null;
}

export interface CreateExpensePayload {
  title: string;
  description?: string;
  amount: number;
  currency?: string;
  category: ExpenseCategory;
  expense_date: string;
  receipt_url?: string;
}

export interface ExpenseStats {
  total: number;
  count: number;
  byCategory: Array<{ category: ExpenseCategory; _sum: { amount: number }; _count: number }>;
  byStatus: Array<{ status: ExpenseStatus; _sum: { amount: number }; _count: number }>;
}

export const CATEGORY_LABELS: Record<ExpenseCategory, { label: string; icon: string }> = {
  TRANSPORT: { label: 'Transport', icon: '🚗' },
  MEALS: { label: 'Repas', icon: '🍽️' },
  ACCOMMODATION: { label: 'Hébergement', icon: '🏨' },
  OFFICE_SUPPLIES: { label: 'Fournitures', icon: '📎' },
  EQUIPMENT: { label: 'Équipement', icon: '💻' },
  TRAINING: { label: 'Formation', icon: '📚' },
  TRAVEL: { label: 'Voyage', icon: '✈️' },
  CLIENT_ENTERTAINMENT: { label: 'Clients', icon: '🤝' },
  COMMUNICATION: { label: 'Communication', icon: '📱' },
  OTHER: { label: 'Autre', icon: '📦' },
};

export const STATUS_LABELS: Record<ExpenseStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Brouillon', color: 'gray' },
  PENDING: { label: 'En attente', color: 'yellow' },
  APPROVED: { label: 'Approuvée', color: 'green' },
  REJECTED: { label: 'Rejetée', color: 'red' },
  PAID: { label: 'Payée', color: 'blue' },
  CANCELLED: { label: 'Annulée', color: 'gray' },
};

class ExpensesService {
  // Créer une note de frais
  async create(data: CreateExpensePayload): Promise<ExpenseReport> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la création');
    }

    const result = await response.json();
    return result.data;
  }

  // Upload justificatif
  async uploadReceipt(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('receipt', file);

    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/expenses/upload-receipt`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de l\'upload');
    }

    const result = await response.json();
    return result.data;
  }

  // Mes notes de frais
  async getMyExpenses(status?: ExpenseStatus): Promise<ExpenseReport[]> {
    const params = status ? `?status=${status}` : '';
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/expenses/my${params}`);

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération');
    }

    const result = await response.json();
    return result.data;
  }

  // Mes statistiques
  async getMyStats(): Promise<ExpenseStats> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/expenses/my/stats`);

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des stats');
    }

    const result = await response.json();
    return result.data;
  }

  // Détails d'une note
  async getOne(id: number): Promise<ExpenseReport> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/expenses/my/${id}`);

    if (!response.ok) {
      throw new Error('Note de frais non trouvée');
    }

    const result = await response.json();
    return result.data;
  }

  // Mettre à jour
  async update(id: number, data: Partial<CreateExpensePayload>): Promise<ExpenseReport> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/expenses/my/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la mise à jour');
    }

    const result = await response.json();
    return result.data;
  }

  // Soumettre
  async submit(id: number): Promise<ExpenseReport> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/expenses/my/${id}/submit`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la soumission');
    }

    const result = await response.json();
    return result.data;
  }

  // Annuler
  async cancel(id: number): Promise<ExpenseReport> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/expenses/my/${id}/cancel`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de l\'annulation');
    }

    const result = await response.json();
    return result.data;
  }

  // Supprimer
  async delete(id: number): Promise<void> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/expenses/my/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la suppression');
    }
  }

  // === ADMIN ===

  // Notes en attente
  async getPending(): Promise<ExpenseReport[]> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/expenses/pending`);

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération');
    }

    const result = await response.json();
    return result.data;
  }

  // Toutes les notes
  async getAll(filters?: {
    status?: ExpenseStatus;
    userId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ExpenseReport[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.userId) params.append('userId', filters.userId.toString());
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/expenses?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération');
    }

    const result = await response.json();
    return result.data;
  }

  // Approuver
  async approve(id: number): Promise<ExpenseReport> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/expenses/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'APPROVED' }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de l\'approbation');
    }

    const result = await response.json();
    return result.data;
  }

  // Rejeter
  async reject(id: number, reason: string): Promise<ExpenseReport> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/expenses/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'REJECTED', rejected_reason: reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors du rejet');
    }

    const result = await response.json();
    return result.data;
  }

  // Marquer comme payée
  async markAsPaid(id: number, paymentRef?: string): Promise<ExpenseReport> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/expenses/${id}/paid`, {
      method: 'PATCH',
      body: JSON.stringify({ payment_ref: paymentRef }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur');
    }

    const result = await response.json();
    return result.data;
  }

  // Stats globales
  async getGlobalStats(): Promise<ExpenseStats> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/expenses/stats`);

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des stats');
    }

    const result = await response.json();
    return result.data;
  }
}

export const expensesService = new ExpensesService();
