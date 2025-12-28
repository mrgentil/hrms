import api from '@/lib/api';

export interface OrgChartNode {
  id: string;
  full_name: string;
  position: string | null;
  department: string | null;
  profile_photo_url: string | null;
  work_email: string | null;
  children: OrgChartNode[];
}

export interface OrgChartResponse {
  success: boolean;
  data: OrgChartNode[];
}

export const orgchartService = {
  async getOrgChart(): Promise<OrgChartResponse> {
    const response = await api.get<OrgChartResponse>('/orgchart');
    return response.data;
  },
};
