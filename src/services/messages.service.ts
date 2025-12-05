import axios from 'axios';
import { authService } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface User {
  id: number;
  full_name: string;
  profile_photo_url?: string;
  work_email?: string;
  active?: boolean;
}

export interface Message {
  id: number;
  content: string;
  conversation_id: number;
  sender_user_id: number;
  created_at: string;
  updated_at: string;
  user_user_message_sender_user_idTouser?: User;
}

export interface Conversation {
  id: number;
  name?: string;
  is_group: boolean;
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
  participants: User[];
  lastMessage?: Message;
  conversation_participant?: Array<{
    id: number;
    user_id: number;
    user: User;
  }>;
}

export interface CreateConversationPayload {
  name?: string;
  is_group?: boolean;
  participant_ids: number[];
}

export interface SendMessagePayload {
  content: string;
  conversation_id: number;
}

class MessagesService {
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

  async getConversations(): Promise<Conversation[]> {
    const response = await axios.get(`${API_BASE_URL}/messages/conversations`, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data;
  }

  async getConversation(id: number): Promise<Conversation> {
    const response = await axios.get(`${API_BASE_URL}/messages/conversations/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data;
  }

  async createConversation(data: CreateConversationPayload): Promise<Conversation> {
    const response = await axios.post(`${API_BASE_URL}/messages/conversations`, data, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data;
  }

  async getMessages(conversationId: number, limit = 50, offset = 0): Promise<Message[]> {
    const response = await axios.get(
      `${API_BASE_URL}/messages/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`,
      { headers: this.getAuthHeaders() }
    );
    return response.data.data;
  }

  async sendMessage(data: SendMessagePayload): Promise<Message> {
    const response = await axios.post(`${API_BASE_URL}/messages/send`, data, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data;
  }

  async deleteMessage(id: number) {
    const response = await axios.delete(`${API_BASE_URL}/messages/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async leaveConversation(id: number) {
    const response = await axios.delete(`${API_BASE_URL}/messages/conversations/${id}/leave`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async addParticipant(conversationId: number, userId: number) {
    const response = await axios.post(
      `${API_BASE_URL}/messages/conversations/${conversationId}/participants`,
      { user_id: userId },
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async searchUsers(query: string): Promise<User[]> {
    const response = await axios.get(`${API_BASE_URL}/messages/users/search?q=${encodeURIComponent(query)}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data;
  }
}

export const messagesService = new MessagesService();
