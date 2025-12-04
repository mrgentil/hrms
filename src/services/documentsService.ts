import { authService } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface UserDocument {
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
  user_user_document_user_idTouser?: {
    id: number;
    full_name: string;
  };
  user_user_document_uploaded_by_user_idTouser?: {
    id: number;
    full_name: string;
  };
}

export interface CreateDocumentPayload {
  name: string;
  document_type?: string;
  file_path?: string;
  is_confidential?: boolean;
  description?: string;
  expires_at?: string;
  user_id: number;
}

class DocumentsService {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const response = await authService.authenticatedFetch(url, options);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur serveur' }));
      throw new Error(error.message || 'Erreur lors de la requête');
    }
    return response.json();
  }

  async getAll(): Promise<UserDocument[]> {
    const result = await this.fetchWithAuth(`${API_BASE_URL}/documents`);
    return result.data;
  }

  async getByUser(userId: number): Promise<UserDocument[]> {
    const result = await this.fetchWithAuth(`${API_BASE_URL}/documents/user/${userId}`);
    return result.data;
  }

  async getOne(id: number): Promise<UserDocument> {
    const result = await this.fetchWithAuth(`${API_BASE_URL}/documents/${id}`);
    return result.data;
  }

  async create(data: CreateDocumentPayload, file?: File): Promise<UserDocument> {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('user_id', data.user_id.toString());
    if (data.document_type) formData.append('document_type', data.document_type);
    if (data.description) formData.append('description', data.description);
    if (data.is_confidential !== undefined) formData.append('is_confidential', data.is_confidential.toString());
    if (data.expires_at) formData.append('expires_at', data.expires_at);
    if (file) formData.append('file', file);

    const response = await authService.authenticatedFetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur serveur' }));
      throw new Error(error.message || 'Erreur lors de la création');
    }
    
    const result = await response.json();
    return result.data;
  }

  async update(id: number, data: Partial<CreateDocumentPayload>, file?: File): Promise<UserDocument> {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.document_type) formData.append('document_type', data.document_type);
    if (data.description) formData.append('description', data.description);
    if (data.is_confidential !== undefined) formData.append('is_confidential', data.is_confidential.toString());
    if (data.expires_at) formData.append('expires_at', data.expires_at);
    if (file) formData.append('file', file);

    const response = await authService.authenticatedFetch(`${API_BASE_URL}/documents/${id}`, {
      method: 'PATCH',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur serveur' }));
      throw new Error(error.message || 'Erreur lors de la mise à jour');
    }
    
    const result = await response.json();
    return result.data;
  }

  async delete(id: number): Promise<void> {
    await this.fetchWithAuth(`${API_BASE_URL}/documents/${id}`, {
      method: 'DELETE',
    });
  }

  getFileUrl(filePath: string): string {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    return `${API_BASE_URL}/${filePath.replace(/^\.?\//, '')}`;
  }
}

export const documentsService = new DocumentsService();
