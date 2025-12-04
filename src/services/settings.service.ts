import axios from 'axios';
import { authService } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface AppSetting {
  id: number;
  key: string;
  value: string | null;
  type: string;
  category: string;
  label: string;
  description?: string;
  is_public: boolean;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  updater?: {
    id: number;
    full_name: string;
  };
}

export interface SettingCategory {
  key: string;
  label: string;
  count: number;
}

export const CATEGORY_ICONS: Record<string, string> = {
  general: '⚙️',
  branding: '🎨',
  seo: '🔍',
  company: '🏢',
  leaves: '🏖️',
  email: '📧',
  custom: '🔧',
};

export const CATEGORY_LABELS: Record<string, string> = {
  general: 'Général',
  branding: 'Apparence & Logo',
  seo: 'SEO & Référencement',
  company: 'Entreprise',
  leaves: 'Congés',
  email: 'Email',
  custom: 'Personnalisé',
};

class SettingsService {
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

  private getAuthHeaders() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
  }

  // Obtenir les paramètres publics (sans auth)
  async getPublicSettings(): Promise<Record<string, any>> {
    const response = await axios.get(`${API_BASE_URL}/settings/public`);
    return response.data.data;
  }

  // Initialiser les paramètres par défaut
  async initialize(): Promise<{ key: string; action: string }[]> {
    const response = await axios.post(
      `${API_BASE_URL}/settings/initialize`,
      {},
      { headers: this.getAuthHeaders() }
    );
    return response.data.data;
  }

  // Obtenir tous les paramètres
  async getAll(category?: string): Promise<AppSetting[]> {
    const query = category ? `?category=${category}` : '';
    const response = await axios.get(
      `${API_BASE_URL}/settings${query}`,
      { headers: this.getAuthHeaders() }
    );
    return response.data.data;
  }

  // Obtenir les catégories
  async getCategories(): Promise<SettingCategory[]> {
    const response = await axios.get(
      `${API_BASE_URL}/settings/categories`,
      { headers: this.getAuthHeaders() }
    );
    return response.data.data;
  }

  // Obtenir un paramètre
  async getByKey(key: string): Promise<AppSetting> {
    const response = await axios.get(
      `${API_BASE_URL}/settings/${key}`,
      { headers: this.getAuthHeaders() }
    );
    return response.data.data;
  }

  // Mettre à jour un paramètre
  async update(key: string, value: string | null): Promise<AppSetting> {
    const response = await axios.patch(
      `${API_BASE_URL}/settings/${key}`,
      { value },
      { headers: this.getAuthHeaders() }
    );
    return response.data.data;
  }

  // Mettre à jour plusieurs paramètres
  async updateMany(settings: { key: string; value: string | null }[]): Promise<{ key: string; success: boolean }[]> {
    const response = await axios.patch(
      `${API_BASE_URL}/settings`,
      { settings },
      { headers: this.getAuthHeaders() }
    );
    return response.data.data;
  }

  // Créer un paramètre personnalisé
  async create(data: {
    key: string;
    value?: string;
    type?: string;
    category?: string;
    label: string;
    description?: string;
    is_public?: boolean;
  }): Promise<AppSetting> {
    const response = await axios.post(
      `${API_BASE_URL}/settings`,
      data,
      { headers: this.getAuthHeaders() }
    );
    return response.data.data;
  }

  // Supprimer un paramètre
  async delete(key: string): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/settings/${key}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Upload d'image pour un paramètre
  async uploadImage(key: string, file: File): Promise<{ key: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getToken();
    const response = await axios.post(
      `${API_BASE_URL}/settings/upload/${key}`,
      formData,
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  }
}

export const settingsService = new SettingsService();
