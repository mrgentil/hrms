import { authService } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Cache simple pour éviter les appels API redondants
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 secondes

export interface DashboardOverview {
  employees: {
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
  };
  departments: number;
  attendance: {
    presentToday: number;
    absentToday: number;
    attendanceRate: number;
  };
  pending: {
    leaves: number;
    expenses: number;
  };
  expenses: {
    totalMonth: number;
  };
}

export interface DepartmentStat {
  id: number;
  name: string;
  count: number;
}

export interface AttendanceTrend {
  date: string;
  day: string;
  count: number;
}

export interface ExpenseTrend {
  month: string;
  amount: number;
}

export interface ExpenseByCategory {
  category: string;
  total: number;
  count: number;
}

export interface Activity {
  type: string;
  message: string;
  date: string;
  status: string;
}

class AnalyticsService {
  private async fetchData<T>(endpoint: string, useCache = true): Promise<T> {
    const cacheKey = `analytics${endpoint}`;
    
    // Vérifier le cache
    if (useCache) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data as T;
      }
    }
    
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/analytics${endpoint}`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des données');
    }
    const result = await response.json();
    
    // Mettre en cache
    cache.set(cacheKey, { data: result.data, timestamp: Date.now() });
    
    return result.data;
  }
  
  // Vider le cache (pour le refresh manuel)
  clearCache() {
    cache.clear();
  }

  async getDashboardOverview(): Promise<DashboardOverview> {
    return this.fetchData('/dashboard');
  }

  async getEmployeesByDepartment(): Promise<DepartmentStat[]> {
    return this.fetchData('/employees/by-department');
  }

  async getAttendanceTrend(): Promise<AttendanceTrend[]> {
    return this.fetchData('/attendance/trend');
  }

  async getExpensesTrend(): Promise<ExpenseTrend[]> {
    return this.fetchData('/expenses/trend');
  }

  async getExpensesByCategory(): Promise<ExpenseByCategory[]> {
    return this.fetchData('/expenses/by-category');
  }

  async getRecentActivity(): Promise<Activity[]> {
    return this.fetchData('/activity');
  }

  async getExpiringContracts(): Promise<any[]> {
    return this.fetchData('/contracts/expiring');
  }

  async getUpcomingBirthdays(): Promise<any[]> {
    return this.fetchData('/birthdays');
  }
}

export const analyticsService = new AnalyticsService();
