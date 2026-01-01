'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_EMPLOYEE' | 'ROLE_SUPER_ADMIN';
  permission?: string | string[];
}

export default function ProtectedRoute({ children, requiredRole, permission }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const { hasPermission } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/signin');
        return;
      }

      const hasRequiredRole = !requiredRole || user?.role === requiredRole || user?.role === 'ROLE_SUPER_ADMIN';
      const hasRequiredPermission = !permission || hasPermission(permission);

      if (!hasRequiredRole || !hasRequiredPermission) {
        router.push('/');
        return;
      }
    }
  }, [user, loading, isAuthenticated, requiredRole, permission, hasPermission, router]);

  // Afficher un loader pendant la vérification
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Si pas authentifié, ne rien afficher (la redirection est en cours)
  if (!isAuthenticated) {
    return null;
  }

  // Si un rôle ou une permission est requis et que l'utilisateur ne l'a pas
  const hasRequiredRole = !requiredRole || user?.role === requiredRole || user?.role === 'ROLE_SUPER_ADMIN';
  const hasRequiredPermission = !permission || hasPermission(permission);

  if (!hasRequiredRole || !hasRequiredPermission) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Accès refusé</h1>
          <p className="mt-2 text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
