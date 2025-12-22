import { authService } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Permission {
  id: number;
  name: string;
  label?: string;
  description?: string;
  group_name?: string;
  group_icon?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  _count?: {
    role_permission: number;
  };
}

export interface MenuItem {
  id: number;
  name: string;
  path?: string;
  icon?: string;
  parent_id?: number;
  permission_id?: number;
  sort_order: number;
  is_active: boolean;
  section: string;
  description?: string;
  permission?: { id: number; name: string; label?: string };
  parent?: { id: number; name: string };
  children?: MenuItem[];
}

export interface PermissionGroup {
  name: string;
  icon: string;
}

export interface CreatePermissionDto {
  name: string;
  label?: string;
  description?: string;
  group_name?: string;
  group_icon?: string;
  sort_order?: number;
}

export interface CreateMenuItemDto {
  name: string;
  path?: string;
  icon?: string;
  parent_id?: number;
  permission_id?: number;
  sort_order?: number;
  is_active?: boolean;
  section?: string;
  description?: string;
}

class PermissionsService {
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await authService.authenticatedFetch(url, options);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur serveur' }));
      throw new Error(error.message || 'Erreur lors de la requête');
    }
    return response.json();
  }

  // ============== PERMISSIONS ==============

  async getAllPermissions(): Promise<Permission[]> {
    const result = await this.request<any>(`${API_BASE_URL}/permissions`);
    return result.data || result;
  }

  async getPermissionsByGroup(): Promise<Record<string, { icon: string; permissions: Permission[] }>> {
    const result = await this.request<any>(`${API_BASE_URL}/permissions/grouped`);
    return result.data || result;
  }

  async getPermissionGroups(): Promise<PermissionGroup[]> {
    const result = await this.request<any>(`${API_BASE_URL}/permissions/groups`);
    return result.data || result;
  }

  async getPermission(id: number): Promise<Permission> {
    const result = await this.request<any>(`${API_BASE_URL}/permissions/${id}`);
    return result.data || result;
  }

  async createPermission(dto: CreatePermissionDto): Promise<Permission> {
    const result = await this.request<any>(`${API_BASE_URL}/permissions`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return result.data || result;
  }

  async updatePermission(id: number, dto: Partial<CreatePermissionDto>): Promise<Permission> {
    const result = await this.request<any>(`${API_BASE_URL}/permissions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
    return result.data || result;
  }

  async deletePermission(id: number): Promise<void> {
    await this.request<any>(`${API_BASE_URL}/permissions/${id}`, {
      method: 'DELETE',
    });
  }

  // ============== MENU ITEMS ==============

  async getAllMenuItems(): Promise<MenuItem[]> {
    const result = await this.request<any>(`${API_BASE_URL}/permissions/menus/all`);
    return result.data || result;
  }

  async getMenuItemsForUser(): Promise<MenuItem[]> {
    const result = await this.request<any>(`${API_BASE_URL}/permissions/menus/user`);
    return result.data || result;
  }

  async getMenuItem(id: number): Promise<MenuItem> {
    const result = await this.request<any>(`${API_BASE_URL}/permissions/menus/${id}`);
    return result.data || result;
  }

  async createMenuItem(dto: CreateMenuItemDto): Promise<MenuItem> {
    const result = await this.request<any>(`${API_BASE_URL}/permissions/menus`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return result.data || result;
  }

  async updateMenuItem(id: number, dto: Partial<CreateMenuItemDto>): Promise<MenuItem> {
    const result = await this.request<any>(`${API_BASE_URL}/permissions/menus/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
    return result.data || result;
  }

  async deleteMenuItem(id: number): Promise<void> {
    await this.request<any>(`${API_BASE_URL}/permissions/menus/${id}`, {
      method: 'DELETE',
    });
  }

  async reorderMenuItems(items: { id: number; sort_order: number; parent_id?: number | null }[]): Promise<void> {
    await this.request<any>(`${API_BASE_URL}/permissions/menus/reorder`, {
      method: 'POST',
      body: JSON.stringify(items),
    });
  }

  // ============== SEED ==============

  async seedDefaultPermissions(): Promise<void> {
    await this.request<any>(`${API_BASE_URL}/permissions/seed`, {
      method: 'POST',
    });
  }
}

export const permissionsService = new PermissionsService();
