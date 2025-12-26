import axios from 'axios';
import { authService } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  entity_type?: string;
  entity_id?: number;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export const NOTIFICATION_TYPE_ICONS: Record<string, string> = {
  PROJECT_ADDED: '📂',
  PROJECT_REMOVED: '📁',
  TASK_ASSIGNED: '✅',
  TASK_UNASSIGNED: '❌',
  TASK_UPDATED: '📝',
  TASK_COMPLETED: '🎉',
  TASK_COMMENT: '💬',
  LEAVE_APPROVED: '✅',
  LEAVE_REJECTED: '❌',
  LEAVE_PENDING: '⏳',
  ANNOUNCEMENT: '📢',
  MESSAGE: '💬',
  MENTION: '🔔',
  TRAINING_APPROVED: '🎓',
  TRAINING_REJECTED: '❌',
  TRAINING_REGISTERED: '📝',
  ELEARNING_BADGE_EARNED: '🏆',
  SYSTEM: '⚙️',
};

class NotificationsService {
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

  async getNotifications(limit = 50): Promise<Notification[]> {
    const response = await axios.get(`${API_BASE_URL}/notifications?limit=${limit}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data;
  }

  async getUnreadNotifications(): Promise<Notification[]> {
    const response = await axios.get(`${API_BASE_URL}/notifications/unread`, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data;
  }

  async getUnreadCount(): Promise<number> {
    const response = await axios.get(`${API_BASE_URL}/notifications/count`, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data.count;
  }

  async markAsRead(notificationIds: number[]) {
    const response = await axios.post(
      `${API_BASE_URL}/notifications/mark-read`,
      { notification_ids: notificationIds },
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async markAllAsRead() {
    const response = await axios.post(
      `${API_BASE_URL}/notifications/mark-read`,
      { mark_all: true },
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async deleteNotification(id: number) {
    const response = await axios.delete(`${API_BASE_URL}/notifications/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async deleteAllNotifications() {
    const response = await axios.delete(`${API_BASE_URL}/notifications`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }
}

export const notificationsService = new NotificationsService();
