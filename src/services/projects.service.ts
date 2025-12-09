import axios from 'axios';
import { authService } from '@/lib/auth';
import { resolveImageUrl } from '@/lib/images';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type ProjectStatus = 'PLANNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE' | 'ARCHIVED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ProjectMember {
  id: number;
  role?: string;
  user: {
    id: number;
    full_name: string;
    profile_photo_url?: string;
    work_email?: string;
  };
}

export interface TaskAssignment {
  id: number;
  user: {
    id: number;
    full_name: string;
    profile_photo_url?: string;
  };
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  start_date?: string;
  due_date?: string;
  completed_at?: string;
  task_column_id: number;
  project_id: number;
  task_assignment: TaskAssignment[];
  user_task_created_by_user_idTouser?: {
    id: number;
    full_name: string;
  };
  task_column?: TaskColumn;
  created_at: string;
  updated_at: string;
}

export interface TaskColumn {
  id: number;
  name: string;
  sort_order: number;
  task?: Task[];
}

export interface TaskBoard {
  id: number;
  name: string;
  task_column: TaskColumn[];
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: ProjectStatus;
  start_date?: string;
  end_date?: string;
  owner_user_id: number;
  user?: {
    id: number;
    full_name: string;
    profile_photo_url?: string;
  };
  project_member: ProjectMember[];
  task_board?: TaskBoard[];
  taskCount?: number;
  memberCount?: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectStats {
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  todo: number;
  completionRate: number;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  status?: ProjectStatus;
  start_date?: string;
  end_date?: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  start_date?: string;
  due_date?: string;
  project_id: number;
  task_column_id: number;
  assignee_ids?: number[];
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  start_date?: string;
  due_date?: string;
  task_column_id?: number;
  assignee_ids?: number[];
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNED: 'Planifié',
  IN_PROGRESS: 'En cours',
  ON_HOLD: 'En pause',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  PLANNED: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  ON_HOLD: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'À faire',
  IN_PROGRESS: 'En cours',
  BLOCKED: 'Bloqué',
  DONE: 'Terminé',
  ARCHIVED: 'Archivé',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Basse',
  MEDIUM: 'Normale',
  HIGH: 'Haute',
  CRITICAL: 'Critique',
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  MEDIUM: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  HIGH: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
};

class ProjectsService {
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

  // Normalize profile photo URLs in project data
  private normalizeProject(project: Project): Project {
    return {
      ...project,
      user: project.user ? {
        ...project.user,
        profile_photo_url: resolveImageUrl(project.user.profile_photo_url) || undefined,
      } : undefined,
      project_member: project.project_member?.map(member => ({
        ...member,
        user: {
          ...member.user,
          profile_photo_url: resolveImageUrl(member.user?.profile_photo_url) || undefined,
        },
      })),
    };
  }

  private normalizeTask(task: Task): Task {
    return {
      ...task,
      task_assignment: task.task_assignment?.map(a => ({
        ...a,
        user: {
          ...a.user,
          profile_photo_url: resolveImageUrl(a.user?.profile_photo_url) || undefined,
        },
      })),
    };
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    const response = await axios.get(`${API_BASE_URL}/projects`, {
      headers: this.getAuthHeaders(),
    });
    const projects = response.data.data as Project[];
    return projects.map(p => this.normalizeProject(p));
  }

  async getProject(id: number): Promise<Project> {
    const response = await axios.get(`${API_BASE_URL}/projects/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return this.normalizeProject(response.data.data);
  }

  async getProjectStats(id: number): Promise<ProjectStats> {
    const response = await axios.get(`${API_BASE_URL}/projects/${id}/stats`, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data;
  }

  async createProject(data: CreateProjectPayload) {
    const response = await axios.post(`${API_BASE_URL}/projects`, data, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async updateProject(id: number, data: Partial<CreateProjectPayload>) {
    const response = await axios.patch(`${API_BASE_URL}/projects/${id}`, data, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async deleteProject(id: number) {
    const response = await axios.delete(`${API_BASE_URL}/projects/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async addProjectMember(projectId: number, userId: number, role?: string) {
    const response = await axios.post(
      `${API_BASE_URL}/projects/${projectId}/members`,
      { user_id: userId, role },
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async removeProjectMember(projectId: number, memberId: number) {
    const response = await axios.delete(
      `${API_BASE_URL}/projects/${projectId}/members/${memberId}`,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  // Tasks
  async getTasks(projectId: number): Promise<Task[]> {
    const response = await axios.get(`${API_BASE_URL}/tasks?project_id=${projectId}`, {
      headers: this.getAuthHeaders(),
    });
    const tasks = response.data.data as Task[];
    return tasks.map(t => this.normalizeTask(t));
  }

  async getBoard(projectId: number): Promise<TaskBoard> {
    const response = await axios.get(`${API_BASE_URL}/tasks/board/${projectId}`, {
      headers: this.getAuthHeaders(),
    });
    const board = response.data.data as TaskBoard;
    // Normalize tasks in each column
    if (board?.task_column) {
      board.task_column = board.task_column.map(col => ({
        ...col,
        task: col.task?.map(t => this.normalizeTask(t)),
      }));
    }
    return board;
  }

  async getTask(id: number): Promise<Task> {
    const response = await axios.get(`${API_BASE_URL}/tasks/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return this.normalizeTask(response.data.data);
  }

  async createTask(data: CreateTaskPayload) {
    const response = await axios.post(`${API_BASE_URL}/tasks`, data, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async updateTask(id: number, data: UpdateTaskPayload) {
    const response = await axios.patch(`${API_BASE_URL}/tasks/${id}`, data, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async moveTask(id: number, columnId: number) {
    const response = await axios.patch(
      `${API_BASE_URL}/tasks/${id}/move`,
      { task_column_id: columnId },
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async deleteTask(id: number) {
    const response = await axios.delete(`${API_BASE_URL}/tasks/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  // Columns
  async createColumn(boardId: number, name: string) {
    const response = await axios.post(
      `${API_BASE_URL}/tasks/columns`,
      { task_board_id: boardId, name },
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async updateColumn(id: number, data: { name?: string; sort_order?: number }) {
    const response = await axios.patch(`${API_BASE_URL}/tasks/columns/${id}`, data, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async deleteColumn(id: number) {
    const response = await axios.delete(`${API_BASE_URL}/tasks/columns/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }
}

export const projectsService = new ProjectsService();
