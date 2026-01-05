import { jwtDecode } from 'jwt-decode';
import { resolveImageUrl } from './images';
import type { UserRole as ApiUserRole } from '@/types/api';

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: ApiUserRole; // Ancien système (deprecated)
  role_id?: number;
  role_info?: {
    id: number;
    name: string;
    description: string;
    color: string;
    icon: string;
    is_system: boolean;
  };
  current_role?: string;
  permissions?: string[]; // Permissions du rôle personnalisé
  work_email?: string;
  active: boolean;
  profile_photo_url?: string | null;
  department?: {
    id: number;
    name: string;
  };
  company?: {
    id: number;
    name: string;
  };
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface JWTPayload {
  sub: number;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user';

  private setTokens(tokens: AuthTokens): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.access_token);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh_token);
    }
  }

  private setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  private normalizeUser(user: User): User {
    const resolvedPhoto = resolveImageUrl(user.profile_photo_url);
    return {
      ...user,
      profile_photo_url: resolvedPhoto ?? null,
    };
  }

  public storeUser(user: User): void {
    this.setUser(this.normalizeUser(user));
  }

  getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }
    return null;
  }

  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }
    return null;
  }

  getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  isTokenExpired(token: string): boolean {
    try {
      const decoded: JWTPayload = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return token !== null && !this.isTokenExpired(token);
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur de connexion');
      }

      const authResponse: AuthResponse = await response.json();
      const normalizedUser = this.normalizeUser(authResponse.user);
      const normalizedResponse: AuthResponse = {
        ...authResponse,
        user: normalizedUser,
      };

      this.setTokens({
        access_token: normalizedResponse.access_token,
        refresh_token: normalizedResponse.refresh_token,
      });
      this.setUser(normalizedUser);

      return normalizedResponse;
    } catch (error) {
      console.error("Erreur de connexion à l'API:", error);
      throw error;
    }
  }

  async register(userData: {
    username: string;
    password: string;
    full_name: string;
    work_email?: string;
  }): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erreur lors de l'inscription");
    }

    const authResponse: AuthResponse = await response.json();
    const normalizedUser = this.normalizeUser(authResponse.user);
    const normalizedResponse: AuthResponse = {
      ...authResponse,
      user: normalizedUser,
    };

    this.setTokens({
      access_token: normalizedResponse.access_token,
      refresh_token: normalizedResponse.refresh_token,
    });
    this.setUser(normalizedUser);

    return normalizedResponse;
  }

  async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        this.logout();
        return null;
      }

      const { access_token } = await response.json();
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, access_token);
      }
      return access_token;
    } catch {
      this.logout();
      return null;
    }
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      window.location.href = '/signin';
    }
  }

  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    let token = this.getAccessToken();

    if (token && this.isTokenExpired(token)) {
      token = await this.refreshAccessToken();
      if (!token) {
        throw new Error('Session expirée');
      }
    }

    // Déterminer si c'est un FormData (pour les uploads de fichiers)
    const isFormData = options.body instanceof FormData;

    const headers: Record<string, string> = {
      // Ne pas mettre Content-Type pour FormData - le browser le gère automatiquement
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        return fetch(url, {
          ...options,
          headers,
        });
      }
      this.logout();
      throw new Error('Session expirée');
    }

    return response;
  }

  async getProfile(): Promise<User> {
    try {
      const response = await this.authenticatedFetch(`${API_BASE_URL}/auth/profile`);

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du profil');
      }

      const profile = await response.json();
      const normalizedProfile = this.normalizeUser(profile);
      this.setUser(normalizedProfile);
      return normalizedProfile;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
