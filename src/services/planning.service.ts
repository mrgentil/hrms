import { apiClient } from '@/lib/api';

export interface TeamMemberSchedule {
  id: number;
  full_name: string;
  department?: { name: string };
  position?: { title: string };
  profile_photo_url?: string;
  events: ScheduleEvent[];
}

export interface ScheduleEvent {
  id: number;
  type: 'LEAVE' | 'REMOTE' | 'ATTENDANCE';
  title: string;
  start_date: string;
  end_date: string;
  status?: string;
  color?: string;
}

export const planningService = {
  getTeamSchedule: async (startDate: string, endDate: string): Promise<TeamMemberSchedule[]> => {
    const response = await apiClient.get('/planning/team', {
      params: { startDate, endDate },
    });
    // The backend should return { success: true, data: [...] }
    return response.data?.data || response.data || [];
  },
};
