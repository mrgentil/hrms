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
    
    const data = response.data?.data || response.data || [];
    
    return data.map((item: any) => {
      const events: ScheduleEvent[] = [];
      
      // Ajouter les congés comme événements
      if (item.leaves && Array.isArray(item.leaves)) {
        item.leaves.forEach((leave: any) => {
          events.push({
            id: leave.id,
            type: leave.type === 'Remote' || leave.leaveTypeName?.toLowerCase().includes('télétravail') ? 'REMOTE' : 'LEAVE',
            title: leave.leaveTypeName || 'Congé',
            start_date: leave.startDate,
            end_date: leave.endDate,
          });
        });
      }

      return {
        id: item.id,
        full_name: item.fullName || item.full_name,
        profile_photo_url: item.avatar || item.profile_photo_url,
        department: { name: item.department },
        position: { title: item.position },
        events: events
      };
    });
  },
};
