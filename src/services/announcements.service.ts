import { authService } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type AnnouncementType = 'INFO' | 'EVENT' | 'POLICY' | 'CELEBRATION' | 'URGENT' | 'MAINTENANCE';
export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  is_published: boolean;
  publish_date: string | null;
  expire_date: string | null;
  department_id: number | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  department?: {
    id: number;
    name: string;
  };
  author?: {
    id: number;
    full_name: string;
    profile_photo_url?: string;
  };
  read_by?: { user_id: number }[];
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  type?: AnnouncementType;
  priority?: AnnouncementPriority;
  is_published?: boolean;
  publish_date?: string;
  expire_date?: string;
  department_id?: number;
}

export interface AnnouncementStats {
  total: number;
  published: number;
  draft: number;
  expired: number;
  byType: Record<string, number>;
}

class AnnouncementsService {
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await authService.authenticatedFetch(url, options);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur serveur' }));
      throw new Error(error.message || 'Erreur lors de la requête');
    }
    return response.json();
  }

  // Récupérer toutes les annonces (admin)
  async getAll(filters?: {
    is_published?: boolean;
    type?: string;
    department_id?: number;
    include_expired?: boolean;
  }): Promise<Announcement[]> {
    const params = new URLSearchParams();
    if (filters?.is_published !== undefined) params.append('is_published', String(filters.is_published));
    if (filters?.type) params.append('type', filters.type);
    if (filters?.department_id) params.append('department_id', String(filters.department_id));
    if (filters?.include_expired) params.append('include_expired', 'true');

    const result = await this.request<any>(`${API_BASE_URL}/announcements?${params.toString()}`);
    return result.data || result;
  }

  // Récupérer mes annonces (employé)
  async getMyAnnouncements(): Promise<Announcement[]> {
    const result = await this.request<any>(`${API_BASE_URL}/announcements/my`);
    return result.data || result;
  }

  // Récupérer une annonce
  async getOne(id: number): Promise<Announcement> {
    const result = await this.request<any>(`${API_BASE_URL}/announcements/${id}`);
    return result.data || result;
  }

  // Créer une annonce
  async create(data: CreateAnnouncementDto): Promise<Announcement> {
    const result = await this.request<any>(`${API_BASE_URL}/announcements`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data || result;
  }

  // Mettre à jour une annonce
  async update(id: number, data: Partial<CreateAnnouncementDto>): Promise<Announcement> {
    const result = await this.request<any>(`${API_BASE_URL}/announcements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return result.data || result;
  }

  // Publier une annonce
  async publish(id: number): Promise<Announcement> {
    const result = await this.request<any>(`${API_BASE_URL}/announcements/${id}/publish`, {
      method: 'PATCH',
    });
    return result.data || result;
  }

  // Dépublier une annonce
  async unpublish(id: number): Promise<Announcement> {
    const result = await this.request<any>(`${API_BASE_URL}/announcements/${id}/unpublish`, {
      method: 'PATCH',
    });
    return result.data || result;
  }

  // Marquer comme lu
  async markAsRead(id: number): Promise<void> {
    await this.request<any>(`${API_BASE_URL}/announcements/${id}/read`, {
      method: 'POST',
    });
  }

  // Supprimer une annonce
  async delete(id: number): Promise<void> {
    await this.request<any>(`${API_BASE_URL}/announcements/${id}`, {
      method: 'DELETE',
    });
  }

  // Statistiques
  async getStats(): Promise<AnnouncementStats> {
    const result = await this.request<any>(`${API_BASE_URL}/announcements/stats`);
    return result.data || result;
  }

  // Obtenir les lecteurs d'une annonce
  async getReaders(id: number): Promise<{
    announcement_id: number;
    total_readers: number;
    total_target: number;
    read_percentage: number;
    readers: Array<{
      user: {
        id: number;
        full_name: string;
        work_email: string;
        profile_photo_url?: string;
        department?: { id: number; name: string };
      };
      read_at: string;
    }>;
  }> {
    const result = await this.request<any>(`${API_BASE_URL}/announcements/${id}/readers`);
    return result.data || result;
  }
}

export const announcementsService = new AnnouncementsService();
