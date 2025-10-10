import { apiClient } from '@/lib/api';
import { 
  Role, 
  CreateRoleDto, 
  ApiResponse, 
  PaginatedResponse, 
  QueryParams 
} from '@/types/api';

export const roleService = {
  // Récupérer tous les rôles
  getRoles: async (params?: QueryParams): Promise<PaginatedResponse<Role>> => {
    const response = await apiClient.get('/roles', { params });
    return response.data;
  },

  // Récupérer un rôle par ID
  getRoleById: async (id: number): Promise<ApiResponse<Role>> => {
    const response = await apiClient.get(`/roles/${id}`);
    return response.data;
  },

  // Créer un nouveau rôle
  createRole: async (roleData: CreateRoleDto): Promise<ApiResponse<Role>> => {
    const response = await apiClient.post('/roles', roleData);
    return response.data;
  },

  // Mettre à jour un rôle
  updateRole: async (id: number, roleData: Partial<CreateRoleDto>): Promise<ApiResponse<Role>> => {
    const response = await apiClient.patch(`/roles/${id}`, roleData);
    return response.data;
  },

  // Supprimer un rôle
  deleteRole: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/roles/${id}`);
    return response.data;
  },

  // Obtenir toutes les permissions disponibles
  getAvailablePermissions: async (): Promise<ApiResponse<string[]>> => {
    const response = await apiClient.get('/roles/permissions');
    return response.data;
  },

  // Obtenir les statistiques des rôles
  getRoleStats: async (): Promise<ApiResponse<{
    total: number;
    byRole: Record<string, number>;
  }>> => {
    const response = await apiClient.get('/roles/stats');
    return response.data;
  },
};
