import axios from 'axios';
import { authService } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type LeaveStatus = 'Approved' | 'Rejected' | 'Pending' | 'Cancelled';
export type LeaveTypeCode =
  | 'CongePaye'
  | 'Maladie'
  | 'TeleTravail'
  | 'Marriage'
  | 'Permission'
  | 'Abscence'
  | 'Demenagement'
  | 'Deces';

export interface LeaveType {
  id: number;
  name: string;
  description?: string | null;
  requires_approval: boolean;
  default_allowance?: number | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: number;
  user_id: number;
  reason: string;
  start_date: string;
  end_date: string;
  status: LeaveStatus;
  type: LeaveTypeCode;
  approver_user_id?: number | null;
  approver_comment?: string | null;
  approved_at?: string | null;
  workflow_step?: string | null;
  leave_type_id?: number | null;
  created_at: string;
  updated_at: string;
  leave_type?: LeaveType | null;
  user?: {
    id: number;
    full_name: string;
    work_email?: string | null;
    department_id?: number | null;
    position_id?: number | null;
  } | null;
}

export interface LeaveApprover {
  id: number;
  full_name: string;
  work_email?: string | null;
}

export interface LeaveBalance {
  id: number;
  year: number;
  days_accrued: number;
  days_used: number;
  days_carried_over: number;
  created_at: string;
  updated_at: string;
  user_id: number;
  leave_type_id: number;
  leave_type: LeaveType;
}

export interface CreateLeaveRequestPayload {
  type: LeaveTypeCode;
  start_date: string;
  end_date: string;
  reason: string;
  leave_type_id?: number;
  approver_user_id?: number;
}

export interface UpdateLeaveStatusPayload {
  status: LeaveStatus;
  workflow_step?: string;
  approver_comment?: string;
}

class LeavesService {
  private getToken(): string | null {
    const accessToken = authService.getAccessToken();
    if (accessToken) {
      return accessToken;
    }

    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private getAuthHeaders() {
    const token = this.getToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    headers['Content-Type'] = 'application/json';
    return headers;
  }

  async getMyLeaves() {
    const response = await axios.get(`${API_BASE_URL}/leaves/my`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getMyLeaveBalances() {
    const response = await axios.get(`${API_BASE_URL}/leaves/balance`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getLeaveApprovers() {
    const response = await axios.get(`${API_BASE_URL}/leaves/approvers`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getLeaveTypes() {
    const response = await axios.get(`${API_BASE_URL}/leaves/types`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getApplicationTypes() {
    const response = await axios.get(`${API_BASE_URL}/leaves/application-types`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async createLeaveRequest(data: CreateLeaveRequestPayload) {
    const response = await axios.post(`${API_BASE_URL}/leaves`, data, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getTeamLeaveRequests() {
    const response = await axios.get(`${API_BASE_URL}/leaves/team`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getAllLeaveRequests() {
    const response = await axios.get(`${API_BASE_URL}/leaves`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async updateLeaveStatus(leaveId: number, payload: UpdateLeaveStatusPayload) {
    const response = await axios.patch(`${API_BASE_URL}/leaves/${leaveId}/status`, payload, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }
}

export const leavesService = new LeavesService();
