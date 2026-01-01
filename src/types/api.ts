export type UserRole =
  | 'ROLE_SUPER_ADMIN'
  | 'ROLE_ADMIN'
  | 'ROLE_MANAGER'
  | 'ROLE_RH'
  | 'ROLE_EMPLOYEE';

// Types pour les utilisateurs
export interface User {
  id: number;
  username: string;
  full_name: string;
  work_email?: string;
  role: UserRole; // Enum principal
  role_id?: number; // Nouveau système
  role_info?: {
    id: number;
    name: string;
    description: string;
    color: string;
    icon: string;
    is_system: boolean;
  };
  current_role?: string; // Nom du rôle actuel
  department_id?: number;
  department?: {
    id: number;
    name: string;
  };
  active: boolean;
  hire_date: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserDto {
  username: string;
  full_name: string;
  work_email: string;
  password?: string;
  role: UserRole;
  role_id?: number; // Nouveau système de rôles
  department_id?: number;
  position_id?: number;
  manager_user_id?: number;
  hire_date?: string;
  active?: boolean;
  send_invitation?: boolean;
}

export interface UpdateUserDto {
  username?: string;
  full_name?: string;
  work_email?: string;
  role?: UserRole;
  department_id?: number;
  active?: boolean;
  position_id?: number;
  manager_user_id?: number;
}

// Types pour les départements
export interface DepartmentManager {
  id: number;
  full_name: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string | null;
  manager_user_id?: number | null;
  manager?: DepartmentManager | null;
  parent_department_id?: number | null;
  parent_department?: {
    id: number;
    name: string;
  } | null;
  positions_count?: number;
  employees_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentDto {
  name: string;
  description?: string;
  manager_user_id?: number;
  parent_department_id?: number;
}

export interface UpdateDepartmentDto extends Partial<CreateDepartmentDto> { }

// Types pour les rôles
export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  users_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRoleDto {
  name: string;
  description: string;
  permissions: string[];
}

// Types pour les profils
export interface Profile {
  id: number;
  user_id: number;
  user?: User;
  birth_date?: string;
  gender?: string;
  marital_status?: string;
  father_name?: string;
  identity_number?: string;
  personal_phone?: string;
  personal_email?: string;
  address?: string;
  city?: string;
  country?: string;
  home_phone?: string;
  created_at: string;
  updated_at: string;
}

// Types pour les documents
export interface Document {
  id: number;
  user_id: number;
  user?: User;
  name: string;
  type: string;
  file_path: string;
  file_size: number;
  is_confidential: boolean;
  expiry_date?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Types pour les postes
export interface Position {
  id: number;
  title: string;
  description?: string;
  department_id?: number;
  department?: Department;
  level?: string;
  employees_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePositionDto {
  title: string;
  level?: string;
  description?: string;
  department_id?: number;
}

export interface UpdatePositionDto extends Partial<CreatePositionDto> { }

// Types pour les réponses API
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminOptions {
  departments: Array<{
    id: number;
    name: string;
  }>;
  positions: Array<{
    id: number;
    title: string;
    level?: string | null;
  }>;
  managers: Array<{
    id: number;
    full_name: string;
    role: UserRole;
  }>;
  roles: UserRole[];
  customRoles?: Array<{
    id: number;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    is_system?: boolean;
  }>;
}

// Types pour les paramètres de requête
export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
  filter?: Record<string, any>;
}
