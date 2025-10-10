import { apiClient } from '@/lib/api';
import {
  ApiResponse,
  CreateDepartmentDto,
  Department,
  PaginatedResponse,
  QueryParams,
} from '@/types/api';

const normalizeDepartment = (department: any): Department => {
  if (!department) {
    return department;
  }

  const {
    user_department_manager_user_idTouser: manager,
    positions_count,
    employees_count,
    ...rest
  } = department;

  return {
    ...rest,
    positions_count: positions_count ?? department.positions_count ?? 0,
    employees_count: employees_count ?? department.employees_count ?? 0,
    manager: manager
      ? {
          id: manager.id,
          full_name: manager.full_name,
        }
      : null,
  };
};

export const departmentService = {
  getDepartments: async (params?: QueryParams): Promise<PaginatedResponse<Department>> => {
    const response = await apiClient.get('/departments', { params });
    const {
      data = [],
      total = 0,
      page = 1,
      limit = params?.limit ?? 10,
      totalPages = 0,
    } = response.data || {};

    return {
      data: (data as any[]).map(normalizeDepartment),
      total,
      page,
      limit,
      totalPages,
    };
  },

  getDepartmentById: async (id: number): Promise<ApiResponse<Department>> => {
    const response = await apiClient.get(`/departments/${id}`);
    const payload = response.data || {};
    return {
      ...payload,
      data: normalizeDepartment(payload.data),
    };
  },

  createDepartment: async (
    departmentData: CreateDepartmentDto
  ): Promise<ApiResponse<Department>> => {
    const response = await apiClient.post('/departments', departmentData);
    const payload = response.data || {};
    return {
      ...payload,
      data: normalizeDepartment(payload.data),
    };
  },

  updateDepartment: async (
    id: number,
    departmentData: Partial<CreateDepartmentDto>
  ): Promise<ApiResponse<Department>> => {
    const response = await apiClient.patch(`/departments/${id}`, departmentData);
    const payload = response.data || {};
    return {
      ...payload,
      data: normalizeDepartment(payload.data),
    };
  },

  deleteDepartment: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/departments/${id}`);
    return response.data;
  },
};
