import { apiClient } from '@/lib/api';
import {
  ApiResponse,
  PaginatedResponse,
  Position,
  CreatePositionDto,
  UpdatePositionDto,
  QueryParams,
} from '@/types/api';

export const positionService = {
  getPositions: async (params?: QueryParams): Promise<PaginatedResponse<Position>> => {
    const response = await apiClient.get('/positions', { params });
    const { data = [], total = 0, page = 1, limit = params?.limit ?? 10, totalPages = 0 } = response.data || {};

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  },

  getPositionById: async (id: number): Promise<ApiResponse<Position>> => {
    const response = await apiClient.get(`/positions/${id}`);
    return response.data;
  },

  createPosition: async (payload: CreatePositionDto): Promise<ApiResponse<Position>> => {
    const response = await apiClient.post('/positions', payload);
    return response.data;
  },

  updatePosition: async (id: number, payload: UpdatePositionDto): Promise<ApiResponse<Position>> => {
    const response = await apiClient.patch(`/positions/${id}`, payload);
    return response.data;
  },

  deletePosition: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete(`/positions/${id}`);
    return response.data;
  },
};
