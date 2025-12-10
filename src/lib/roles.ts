import { apiClient } from './api';

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  color: string;
  icon: string;
  is_system: boolean;
  userCount: number;
  created_at: string;
  updated_at: string;
  users?: User[];
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  work_email: string;
}

export interface CreateRoleData {
  name: string;
  description: string;
  permissions: string[];
  color?: string;
  icon?: string;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: string[];
  color?: string;
  icon?: string;
}

export interface PermissionItem {
  name: string;
  description: string;
}

export type PermissionsCatalog = Record<string, PermissionItem[]>;

export interface RoleResponse {
  success: boolean;
  data: Role | Role[];
  message?: string;
}

class RolesService {
  /**
   * RÃ©cupÃ©rer tous les rÃ´les
   */
  async getRoles(): Promise<Role[]> {
    try {
      const response = await apiClient.get('/roles');
      return response.data.data;
    } catch (error: any) {
      console.error('Erreur lors de la rÃ©cupÃ©ration des rÃ´les:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la rÃ©cupÃ©ration des rÃ´les');
    }
  }

  /**
   * RÃ©cupÃ©rer un rÃ´le par ID
   */
  async getRole(id: number): Promise<Role> {
    try {
      const response = await apiClient.get(`/roles/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Erreur lors de la rÃ©cupÃ©ration du rÃ´le:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la rÃ©cupÃ©ration du rÃ´le');
    }
  }

  /**
   * CrÃ©er un nouveau rÃ´le
   */
  async createRole(data: CreateRoleData): Promise<Role> {
    try {
      const response = await apiClient.post('/roles', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Erreur lors de la crÃ©ation du rÃ´le:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la crÃ©ation du rÃ´le');
    }
  }

  /**
   * Mettre Ã  jour un rÃ´le
   */
  async updateRole(id: number, data: UpdateRoleData): Promise<Role> {
    try {
      const response = await apiClient.patch(`/roles/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Erreur lors de la mise Ã  jour du rÃ´le:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise Ã  jour du rÃ´le');
    }
  }

  /**
   * Supprimer un rÃ´le
   */
  async deleteRole(id: number): Promise<void> {
    try {
      await apiClient.delete(`/roles/${id}`);
    } catch (error: any) {
      console.error('Erreur lors de la suppression du rÃ´le:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la suppression du rÃ´le');
    }
  }

  /**
   * RÃ©cupÃ©rer toutes les permissions disponibles
   */
  async getAvailablePermissions(): Promise<PermissionsCatalog> {
    try {
      const response = await apiClient.get('/roles/permissions');
      return response.data.data;
    } catch (error: any) {
      console.error('Erreur lors de la rÃ©cupÃ©ration des permissions:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la rÃ©cupÃ©ration des permissions');
    }
  }

  /**
   * Initialiser les rÃ´les prÃ©dÃ©finis
   */
  async initializePredefinedRoles(): Promise<any> {
    try {
      const response = await apiClient.post('/roles/initialize');
      return response.data.data;
    } catch (error: any) {
      console.error('Erreur lors de l\'initialisation des rÃ´les:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'initialisation des rÃ´les');
    }
  }

  /**
   * Assigner un rÃ´le Ã  un utilisateur
   */
  async assignRoleToUser(userId: number, roleId: number): Promise<any> {
    try {
      const response = await apiClient.post('/roles/assign', { userId, roleId });
      return response.data.data;
    } catch (error: any) {
      console.error('Erreur lors de l\'assignation du rÃ´le:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'assignation du rÃ´le');
    }
  }

  /**
   * RÃ©cupÃ©rer les permissions d'un utilisateur
   */
  async getUserPermissions(userId: number): Promise<string[]> {
    try {
      const response = await apiClient.get(`/roles/user/${userId}/permissions`);
      return response.data.data;
    } catch (error: any) {
      console.error('Erreur lors de la rÃ©cupÃ©ration des permissions utilisateur:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la rÃ©cupÃ©ration des permissions utilisateur');
    }
  }
}

export const rolesService = new RolesService();
