import { authService } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ============================================
// TYPES
// ============================================

export interface TaskComment {
  id: number;
  content: string;
  task_id: number;
  user_id: number;
  parent_comment_id?: number;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    full_name: string;
    profile_photo_url?: string;
  };
  parent_comment?: {
    id: number;
    content: string;
    user: {
      id: number;
      full_name: string;
    };
  };
}

export interface TaskAttachment {
  id: number;
  file_name: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  task_id: number;
  uploaded_by: number;
  created_at: string;
  user: {
    id: number;
    full_name: string;
  };
}

export interface ChecklistItem {
  id: number;
  title: string;
  is_completed: boolean;
  sort_order: number;
  checklist_id: number;
  completed_by?: number;
  completed_at?: string;
  user?: {
    id: number;
    full_name: string;
  };
}

export interface TaskChecklist {
  id: number;
  title: string;
  sort_order: number;
  task_id: number;
  items: ChecklistItem[];
}

export interface TaskActivity {
  id: number;
  action: string;
  field?: string;
  old_value?: string;
  new_value?: string;
  task_id: number;
  user_id: number;
  created_at: string;
  user: {
    id: number;
    full_name: string;
    profile_photo_url?: string;
  };
}

export interface TaskWithDetails {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  start_date?: string;
  due_date?: string;
  task_column: { id: number; name: string };
  task_assignment: Array<{
    user: { id: number; full_name: string; profile_photo_url?: string };
  }>;
  subtasks?: Array<{ id: number; status: string }>;
  task_comments?: Array<{ id: number }>;
  task_attachments?: Array<{ id: number }>;
  task_checklists?: Array<{
    items: Array<{ id: number; is_completed: boolean }>;
  }>;
}

// ============================================
// SERVICE
// ============================================

class TaskFeaturesService {
  // ============================================
  // COMMENTAIRES
  // ============================================

  async getComments(taskId: number): Promise<TaskComment[]> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/tasks/${taskId}/comments`
    );
    if (!response.ok) throw new Error('Erreur lors du chargement des commentaires');
    const result = await response.json();
    return result.data;
  }

  async addComment(taskId: number, content: string, parentCommentId?: number): Promise<TaskComment> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/tasks/${taskId}/comments`,
      {
        method: 'POST',
        body: JSON.stringify({ 
          content,
          parent_comment_id: parentCommentId,
        }),
      }
    );
    if (!response.ok) throw new Error('Erreur lors de l\'ajout du commentaire');
    const result = await response.json();
    return result.data;
  }

  async updateComment(commentId: number, content: string): Promise<TaskComment> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/tasks/comments/${commentId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      }
    );
    if (!response.ok) throw new Error('Erreur lors de la mise à jour');
    const result = await response.json();
    return result.data;
  }

  async deleteComment(commentId: number): Promise<void> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/tasks/comments/${commentId}`,
      { method: 'DELETE' }
    );
    if (!response.ok) throw new Error('Erreur lors de la suppression');
  }

  // ============================================
  // PIÈCES JOINTES
  // ============================================

  async getAttachments(taskId: number): Promise<TaskAttachment[]> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/tasks/${taskId}/attachments`
    );
    if (!response.ok) throw new Error('Erreur lors du chargement des pièces jointes');
    const result = await response.json();
    return result.data;
  }

  async uploadAttachment(taskId: number, file: File): Promise<TaskAttachment> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/attachments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) throw new Error('Erreur lors de l\'upload');
    const result = await response.json();
    return result.data;
  }

  async deleteAttachment(attachmentId: number): Promise<void> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/tasks/attachments/${attachmentId}`,
      { method: 'DELETE' }
    );
    if (!response.ok) throw new Error('Erreur lors de la suppression');
  }

  // ============================================
  // CHECKLISTS
  // ============================================

  async getChecklists(taskId: number): Promise<TaskChecklist[]> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/tasks/${taskId}/checklists`
    );
    if (!response.ok) throw new Error('Erreur lors du chargement des checklists');
    const result = await response.json();
    return result.data;
  }

  async createChecklist(taskId: number, title: string): Promise<TaskChecklist> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/tasks/${taskId}/checklists`,
      {
        method: 'POST',
        body: JSON.stringify({ title }),
      }
    );
    if (!response.ok) throw new Error('Erreur lors de la création');
    const result = await response.json();
    return result.data;
  }

  async updateChecklist(checklistId: number, title: string): Promise<TaskChecklist> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/tasks/checklists/${checklistId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      }
    );
    if (!response.ok) throw new Error('Erreur lors de la mise à jour');
    const result = await response.json();
    return result.data;
  }

  async deleteChecklist(checklistId: number): Promise<void> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/tasks/checklists/${checklistId}`,
      { method: 'DELETE' }
    );
    if (!response.ok) throw new Error('Erreur lors de la suppression');
  }

  async addChecklistItem(checklistId: number, title: string): Promise<ChecklistItem> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/tasks/checklists/${checklistId}/items`,
      {
        method: 'POST',
        body: JSON.stringify({ title }),
      }
    );
    if (!response.ok) throw new Error('Erreur lors de l\'ajout');
    const result = await response.json();
    return result.data;
  }

  async toggleChecklistItem(itemId: number): Promise<ChecklistItem> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/tasks/checklist-items/${itemId}/toggle`,
      { method: 'PATCH' }
    );
    if (!response.ok) throw new Error('Erreur lors de la mise à jour');
    const result = await response.json();
    return result.data;
  }

  async deleteChecklistItem(itemId: number): Promise<void> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/tasks/checklist-items/${itemId}`,
      { method: 'DELETE' }
    );
    if (!response.ok) throw new Error('Erreur lors de la suppression');
  }

  // ============================================
  // SOUS-TÂCHES
  // ============================================

  async getSubtasks(taskId: number): Promise<TaskWithDetails[]> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/tasks/${taskId}/subtasks`
    );
    if (!response.ok) throw new Error('Erreur lors du chargement des sous-tâches');
    const result = await response.json();
    return result.data;
  }

  async createSubtask(taskId: number, data: {
    title: string;
    description?: string;
    priority?: string;
    assignee_ids?: number[];
  }): Promise<TaskWithDetails> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/tasks/${taskId}/subtasks`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) throw new Error('Erreur lors de la création');
    const result = await response.json();
    return result.data;
  }

  async updateSubtask(subtaskId: number, data: {
    title?: string;
    description?: string;
    priority?: string;
    status?: string;
    assignee_ids?: number[];
  }): Promise<TaskWithDetails> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/tasks/subtasks/${subtaskId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) throw new Error('Erreur lors de la mise à jour');
    const result = await response.json();
    return result.data;
  }

  async deleteSubtask(subtaskId: number): Promise<void> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/tasks/subtasks/${subtaskId}`,
      {
        method: 'DELETE',
      }
    );
    if (!response.ok) throw new Error('Erreur lors de la suppression');
  }

  // ============================================
  // HISTORIQUE D'ACTIVITÉ
  // ============================================

  async getActivities(taskId: number): Promise<TaskActivity[]> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/tasks/${taskId}/activities`
    );
    if (!response.ok) throw new Error('Erreur lors du chargement de l\'historique');
    const result = await response.json();
    return result.data;
  }

  // ============================================
  // VUE LISTE
  // ============================================

  async getTasksList(projectId: number, filters?: {
    status?: string;
    priority?: string;
    assigneeId?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<TaskWithDetails[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.assigneeId) params.append('assigneeId', String(filters.assigneeId));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/tasks/project/${projectId}/list${query}`
    );
    if (!response.ok) throw new Error('Erreur lors du chargement');
    const result = await response.json();
    return result.data;
  }

  // ============================================
  // VUE CALENDRIER
  // ============================================

  async getTasksCalendar(projectId: number, year: number, month: number): Promise<TaskWithDetails[]> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/tasks/project/${projectId}/calendar?year=${year}&month=${month}`
    );
    if (!response.ok) throw new Error('Erreur lors du chargement');
    const result = await response.json();
    return result.data;
  }

  async getTasksForDateRange(projectId: number, startDate: string, endDate: string): Promise<TaskWithDetails[]> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/tasks/project/${projectId}/calendar/range?startDate=${startDate}&endDate=${endDate}`
    );
    if (!response.ok) throw new Error('Erreur lors du chargement');
    const result = await response.json();
    return result.data;
  }
}

export const taskFeaturesService = new TaskFeaturesService();
