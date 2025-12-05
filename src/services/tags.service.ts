import axios from 'axios';
import { authService } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Tag {
  id: number;
  name: string;
  color: string;
  created_at: string;
  _count?: {
    project_tags: number;
    task_tags: number;
  };
}

export const TAG_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#22C55E', // Green
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#0EA5E9', // Sky
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#D946EF', // Fuchsia
  '#EC4899', // Pink
  '#6B7280', // Gray
];

class TagsService {
  private getToken(): string | null {
    const accessToken = authService.getAccessToken();
    if (accessToken) return accessToken;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private getAuthHeaders() {
    const token = this.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  async getTags(): Promise<Tag[]> {
    const response = await axios.get(`${API_BASE_URL}/tags`, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data;
  }

  async getTag(id: number): Promise<Tag> {
    const response = await axios.get(`${API_BASE_URL}/tags/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data;
  }

  async createTag(data: { name: string; color?: string }): Promise<Tag> {
    const response = await axios.post(`${API_BASE_URL}/tags`, data, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data;
  }

  async updateTag(id: number, data: { name?: string; color?: string }): Promise<Tag> {
    const response = await axios.patch(`${API_BASE_URL}/tags/${id}`, data, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data;
  }

  async deleteTag(id: number) {
    const response = await axios.delete(`${API_BASE_URL}/tags/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async searchTags(query: string): Promise<Tag[]> {
    const response = await axios.get(`${API_BASE_URL}/tags/search?q=${encodeURIComponent(query)}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data;
  }

  async findOrCreateTag(name: string, color?: string): Promise<Tag> {
    const response = await axios.post(`${API_BASE_URL}/tags/find-or-create`, { name, color }, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data;
  }

  // Project tags
  async getProjectTags(projectId: number): Promise<{ tag: Tag }[]> {
    const response = await axios.get(`${API_BASE_URL}/tags/project/${projectId}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data;
  }

  async setProjectTags(projectId: number, tagIds: number[]) {
    const response = await axios.post(`${API_BASE_URL}/tags/project/${projectId}`, { tag_ids: tagIds }, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async addProjectTag(projectId: number, tagId: number) {
    const response = await axios.post(`${API_BASE_URL}/tags/project/${projectId}/tag/${tagId}`, {}, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async removeProjectTag(projectId: number, tagId: number) {
    const response = await axios.delete(`${API_BASE_URL}/tags/project/${projectId}/tag/${tagId}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  // Task tags
  async getTaskTags(taskId: number): Promise<{ tag: Tag }[]> {
    const response = await axios.get(`${API_BASE_URL}/tags/task/${taskId}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data;
  }

  async setTaskTags(taskId: number, tagIds: number[]) {
    const response = await axios.post(`${API_BASE_URL}/tags/task/${taskId}`, { tag_ids: tagIds }, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async addTaskTag(taskId: number, tagId: number) {
    const response = await axios.post(`${API_BASE_URL}/tags/task/${taskId}/tag/${tagId}`, {}, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async removeTaskTag(taskId: number, tagId: number) {
    const response = await axios.delete(`${API_BASE_URL}/tags/task/${taskId}/tag/${tagId}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }
}

export const tagsService = new TagsService();
