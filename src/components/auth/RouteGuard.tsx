'use client';

import { useUserRole, hasPermission } from '@/hooks/useUserRole';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type RoleCode = 'ROLE_EMPLOYEE' | 'ROLE_MANAGER' | 'ROLE_RH' | 'ROLE_ADMIN' | 'ROLE_SUPER_ADMIN';

interface RouteGuardProps {
  children: React.ReactNode;
  /** Rôles autorisés à voir cette page */
  allowedRoles?: RoleCode[];
  /** Permission requise (ex: 'payroll.manage') */
  requiredPermission?: string;
  /** URL de redirection si accès refusé (défaut: '/') */
  redirectTo?: string;
}

/**
 * Composant de protection des pages par rôle et/ou permission.
 * Empêche un employé d'accéder à une page admin en tapant l'URL directement.
 * 
 * Usage:
 * <RouteGuard allowedRoles={['ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
 *   <MonContenuProtégé />
 * </RouteGuard>
 */
export default function RouteGuard({ 
  children, 
  allowedRoles, 
  requiredPermission,
  redirectTo = '/' 
}: RouteGuardProps) {
  const { role: userRole, loading } = useUserRole();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (loading || !userRole) return;

    // Super Admin bypasse tout
    if (userRole.isSuperAdmin) {
      setAuthorized(true);
      return;
    }

    let isAllowed = true;

    // Vérification du rôle
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(userRole.role as RoleCode)) {
        isAllowed = false;
      }
    }

    // Vérification de la permission
    if (requiredPermission && !hasPermission(userRole, requiredPermission)) {
      isAllowed = false;
    }

    if (!isAllowed) {
      router.replace(redirectTo);
    } else {
      setAuthorized(true);
    }
  }, [userRole, loading, allowedRoles, requiredPermission, redirectTo, router]);

  if (loading || !userRole) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Accès restreint</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Vous n'avez pas les droits nécessaires pour accéder à cette page.
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Redirection en cours...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
