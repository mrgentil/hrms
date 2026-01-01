import { authService } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'REMOTE' | 'ON_LEAVE';

export interface Attendance {
  id: number;
  user_id: number;
  date: string;
  check_in: string | null;
  check_out: string | null;
  check_in_location: string | null;
  check_out_location: string | null;
  status: AttendanceStatus;
  notes: string | null;
  worked_hours: number | null;
  overtime_hours: number | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    full_name: string;
    work_email?: string;
    department?: {
      name: string;
    } | null;
    position?: {
      title: string;
    };
  };
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  remoteDays: number;
  onLeaveDays: number;
  totalWorkedHours: number;
  totalOvertimeHours: number;
  month: number;
  year: number;
}

export interface GlobalAttendanceStats {
  date: string;
  totalEmployees: number;
  checkedIn: number;
  checkedOut: number;
  notCheckedIn: number;
  late: number;
  remote: number;
  onLeave: number;
  attendanceRate: number;
}

class AttendanceService {
  // Check-in
  async checkIn(location?: string, notes?: string, status?: AttendanceStatus): Promise<Attendance> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/attendance/check-in`, {
      method: 'POST',
      body: JSON.stringify({ location, notes, status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors du pointage');
    }

    const result = await response.json();
    return result.data;
  }

  // Check-out
  async checkOut(location?: string, notes?: string): Promise<Attendance> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/attendance/check-out`, {
      method: 'POST',
      body: JSON.stringify({ location, notes }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors du pointage');
    }

    const result = await response.json();
    return result.data;
  }

  // Pointage d'aujourd'hui
  async getTodayAttendance(): Promise<Attendance | null> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/attendance/today`);

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du pointage');
    }

    const result = await response.json();
    return result.data;
  }

  // Historique personnel
  async getMyAttendance(startDate?: string, endDate?: string): Promise<Attendance[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/attendance/my?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de l\'historique');
    }

    const result = await response.json();
    return result.data;
  }

  // Statistiques mensuelles personnelles
  async getMyMonthlyStats(month?: number, year?: number): Promise<AttendanceStats> {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());

    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/attendance/my/stats?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des statistiques');
    }

    const result = await response.json();
    return result.data;
  }

  // Admin: Tous les pointages
  async getAllAttendance(startDate?: string, endDate?: string, userId?: number): Promise<Attendance[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (userId) params.append('userId', userId.toString());

    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/attendance?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des pointages');
    }

    const result = await response.json();
    return result.data;
  }

  // Admin: Statistiques globales
  async getGlobalStats(date?: string): Promise<GlobalAttendanceStats> {
    const params = date ? `?date=${date}` : '';
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/attendance/stats/global${params}`
    );

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des statistiques');
    }

    const result = await response.json();
    return result.data;
  }

  // Admin: Modifier un pointage
  async updateAttendance(id: number, data: Partial<Attendance>): Promise<Attendance> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/attendance/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la mise à jour');
    }

    const result = await response.json();
    return result.data;
  }

  // Récupérer les horaires de travail configurés
  async getWorkSchedule(): Promise<WorkSchedule> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/attendance/settings/schedule`);

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des horaires');
    }

    const result = await response.json();
    return result.data;
  }

  // Admin: Mettre à jour les horaires de travail
  async updateWorkSchedule(data: Partial<WorkSchedule>): Promise<WorkSchedule> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/attendance/settings/schedule`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la mise à jour des horaires');
    }

    const result = await response.json();
    return result.data;
  }
}

export interface WorkSchedule {
  workStartTime: string;
  workEndTime: string;
  workStartHour: number;
  workStartMinute: number;
  workEndHour: number;
  workEndMinute: number;
  lateToleranceMinutes: number;
  dailyWorkHours: number;
}

export const attendanceService = new AttendanceService();
