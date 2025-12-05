import { authService } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: {
    id: number;
    full_name: string;
  };
}

export interface AuditStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  byAction: { action: string; count: number }[];
  byEntity: { entity: string; count: number }[];
}

class AuditService {
  private async request<T>(url: string): Promise<T> {
    const response = await authService.authenticatedFetch(url);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur serveur' }));
      throw new Error(error.message || 'Erreur lors de la requête');
    }
    return response.json();
  }

  // Récupérer les logs
  async getLogs(filters?: {
    user_id?: number;
    action?: string;
    entity_type?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: AuditLog[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.user_id) params.append('user_id', String(filters.user_id));
    if (filters?.action) params.append('action', filters.action);
    if (filters?.entity_type) params.append('entity_type', filters.entity_type);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    const result = await this.request<any>(`${API_BASE_URL}/audit?${params.toString()}`);
    return { data: result.data, total: result.total };
  }

  // Statistiques
  async getStats(): Promise<AuditStats> {
    const result = await this.request<any>(`${API_BASE_URL}/audit/stats`);
    return result.data;
  }
}

export const auditService = new AuditService();
