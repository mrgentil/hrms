import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authService } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

type RoleCode = 'ROLE_EMPLOYEE' | 'ROLE_MANAGER' | 'ROLE_RH' | 'ROLE_ADMIN' | 'ROLE_SUPER_ADMIN';

interface DecodedToken {
  sub?: number;
  id?: number;
  username: string;
  role?: string;
  role_id?: number;
  permissions?: string[];
  exp: number;
}

export interface UserRole {
  role: RoleCode;
  permissions: string[];
  isEmployee: boolean;
  isManager: boolean;
  isHR: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export interface UseUserRoleResult {
  role: UserRole | null;
  loading: boolean;
}

const ROLE_ALIASES: Record<string, RoleCode> = {
  ROLE_EMPLOYEE: 'ROLE_EMPLOYEE',
  EMPLOYEE: 'ROLE_EMPLOYEE',
  'EMPLOYÉ': 'ROLE_EMPLOYEE',
  ROLE_MANAGER: 'ROLE_MANAGER',
  MANAGER: 'ROLE_MANAGER',
  ROLE_RH: 'ROLE_RH',
  RH: 'ROLE_RH',
  ROLE_HR: 'ROLE_RH',
  HR: 'ROLE_RH',
  ROLE_ADMIN: 'ROLE_ADMIN',
  ADMIN: 'ROLE_ADMIN',
  ROLE_SUPER_ADMIN: 'ROLE_SUPER_ADMIN',
  SUPER_ADMIN: 'ROLE_SUPER_ADMIN',
  'SUPER ADMIN': 'ROLE_SUPER_ADMIN',
};

function normalizeRole(value?: string | null): RoleCode {
  if (!value) {
    return 'ROLE_EMPLOYEE';
  }

  const upper = value.toUpperCase();
  return ROLE_ALIASES[upper] ?? 'ROLE_EMPLOYEE';
}

function buildRoleState(role: RoleCode, permissions: string[]): UserRole {
  return {
    role,
    permissions,
    isEmployee: role === 'ROLE_EMPLOYEE',
    isManager: role === 'ROLE_MANAGER',
    isHR: role === 'ROLE_RH',
    isAdmin: role === 'ROLE_ADMIN',
    isSuperAdmin: role === 'ROLE_SUPER_ADMIN',
  };
}

export function useUserRole(): UseUserRoleResult {
  const { user, loading: authLoading } = useAuth();
  const [roleState, setRoleState] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    let isMounted = true;

    const evaluateRole = () => {
      try {
        const accessToken = authService.getAccessToken();
        const legacyToken =
          typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const token = accessToken || legacyToken;

        let decoded: DecodedToken | null = null;

        if (token) {
          try {
            decoded = jwtDecode<DecodedToken>(token);
            if (decoded.exp * 1000 < Date.now()) {
              decoded = null;
            }
          } catch (decodeError) {
            console.error('Erreur lors du décodage du token:', decodeError);
            decoded = null;
          }
        }

        const storedUser = authService.getUser();
        const resolvedRole = normalizeRole(
          decoded?.role ||
            user?.role ||
            storedUser?.role ||
            storedUser?.current_role ||
            undefined,
        );

        const permissionSet = new Set<string>(decoded?.permissions ?? []);
        permissionSet.add('profile.view_own');

        if (
          ['ROLE_MANAGER', 'ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'].includes(
            resolvedRole,
          )
        ) {
          permissionSet.add('users.view');
        }

        if (['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'].includes(resolvedRole)) {
          permissionSet.add('system.admin');
        }

        if (isMounted) {
          setRoleState(buildRoleState(resolvedRole, Array.from(permissionSet)));
          setLoading(false);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du rôle utilisateur:', error);
        if (isMounted) {
          setRoleState(null);
          setLoading(false);
        }
      }
    };

    evaluateRole();

    return () => {
      isMounted = false;
    };
  }, [authLoading, user]);

  return { role: roleState, loading };
}

export function hasPermission(userRole: UserRole | null, permission: string): boolean {
  if (!userRole) return false;
  
  // Super admin a tous les droits
  if (userRole.isSuperAdmin) return true;
  
  // Vérifier si l'utilisateur a la permission spécifique
  return userRole.permissions.includes(permission) || userRole.permissions.includes('system.admin');
}

export function canAccessEmployeeFeatures(userRole: UserRole | null): boolean {
  if (!userRole) return false;
  
  // Tous les rôles peuvent accéder aux fonctionnalités employé de base
  return true;
}

export function canAccessAdminFeatures(userRole: UserRole | null): boolean {
  if (!userRole) return false;
  
  return userRole.isAdmin || userRole.isSuperAdmin || userRole.isHR;
}

export function canAccessManagerFeatures(userRole: UserRole | null): boolean {
  if (!userRole) return false;
  
  return userRole.isManager || userRole.isAdmin || userRole.isSuperAdmin || userRole.isHR;
}
