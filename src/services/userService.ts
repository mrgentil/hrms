import { apiClient } from '@/lib/api';
import {
  User,
  CreateUserDto,
  UpdateUserDto,
  ApiResponse,
  PaginatedResponse,
  QueryParams,
  AdminOptions,
} from '@/types/api';

export const userService = {
  // Récupérer tous les utilisateurs avec pagination
  getUsers: async (params?: QueryParams): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  // Récupérer un utilisateur par ID
  getUserById: async (id: number): Promise<ApiResponse<User>> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  // Créer un nouvel utilisateur
  createUser: async (userData: CreateUserDto): Promise<ApiResponse<User>> => {
    const response = await apiClient.post('/users', userData);
    return response.data;
  },

  // Mettre à jour un utilisateur
  updateUser: async (id: number, userData: UpdateUserDto): Promise<ApiResponse<User>> => {
    const response = await apiClient.patch(`/users/${id}`, userData);
    return response.data;
  },

  // Supprimer un utilisateur
  deleteUser: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },

  // Activer/Désactiver un utilisateur
  toggleUserStatus: async (id: number): Promise<ApiResponse<User>> => {
    const response = await apiClient.patch(`/users/${id}/toggle-status`);
    return response.data;
  },

  // Rechercher des utilisateurs
  searchUsers: async (query: string): Promise<ApiResponse<User[]>> => {
    const response = await apiClient.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Obtenir les statistiques des utilisateurs
  getUserStats: async (): Promise<ApiResponse<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
    byDepartment: Record<string, number>;
  }>> => {
    const response = await apiClient.get('/users/stats');
    return response.data;
  },

  // Exporter les utilisateurs
  exportUsers: async (format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> => {
    const response = await apiClient.get(`/users/export?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Importer des utilisateurs depuis un fichier CSV
  importUsers: async (file: File): Promise<ApiResponse<{
    imported: number;
    errors: string[];
  }>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/users/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Obtenir les options nécessaires à la création d'un utilisateur
  getAdminOptions: async (): Promise<ApiResponse<AdminOptions>> => {
    const response = await apiClient.get('/users/admin/options');
    return response.data;
  },
};
