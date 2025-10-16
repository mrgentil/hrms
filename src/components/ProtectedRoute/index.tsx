'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole, hasPermission } from '@/hooks/useUserRole';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: 'ROLE_EMPLOYEE' | 'ROLE_MANAGER' | 'ROLE_RH' | 'ROLE_ADMIN' | 'ROLE_SUPER_ADMIN';
  fallbackPath?: string;
  showUnauthorized?: boolean;
}

export default function ProtectedRoute({
  children,
  requiredPermission,
  requiredRole,
  fallbackPath = '/employee-dashboard',
  showUnauthorized = true,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { role: userRole, loading: roleLoading } = useUserRole();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (roleLoading) {
      return;
    }
    
    setIsChecking(false);

    if (!userRole) {
      if (!showUnauthorized) {
        router.replace(fallbackPath);
      }
      return;
    }

    if (requiredPermission && !hasPermission(userRole, requiredPermission)) {
      if (showUnauthorized) {
        return;
      }
      router.replace(fallbackPath);
      return;
    }

    if (requiredRole && userRole.role !== requiredRole) {
      if (showUnauthorized) {
        return;
      }
      router.replace(fallbackPath);
    }
  }, [
    userRole,
    roleLoading,
    requiredPermission,
    requiredRole,
    router,
    fallbackPath,
    showUnauthorized,
  ]);

  // Affichage de chargement
  if (isChecking || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!userRole) {
    if (showUnauthorized) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-xl font-semibold text-black dark:text-white mb-2">
              Authentification requise
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Vous devez être connecté pour accéder à cette page.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/signin')}
                className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  // Vérifier les permissions après le chargement
  const hasRequiredPermission =
    !requiredPermission || hasPermission(userRole, requiredPermission);
  const hasRequiredRole = !requiredRole || userRole.role === requiredRole;

  if (!hasRequiredPermission || !hasRequiredRole) {
    if (showUnauthorized) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-xl font-semibold text-black dark:text-white mb-2">
              Accès non autorisé
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.back()}
                className="w-full inline-flex items-center justify-center rounded-md border border-stroke px-4 py-2 text-sm font-medium text-black transition-colors hover:border-primary hover:text-primary dark:border-strokedark dark:text-white"
              >
                Retour
              </button>
              <button
                onClick={() => router.push(fallbackPath)}
                className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Aller à mon espace
              </button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}

// Composant pour les fonctionnalités admin uniquement
export function AdminOnly({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute
      requiredPermission="system.admin"
      fallbackPath="/employee-dashboard"
    >
      {children}
    </ProtectedRoute>
  );
}

// Composant pour les managers et plus
export function ManagerOnly({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute
      requiredPermission="users.view"
      fallbackPath="/employee-dashboard"
    >
      {children}
    </ProtectedRoute>
  );
}

// Composant pour les employés (accès de base)
export function EmployeeAccess({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute
      requiredPermission="profile.view_own"
      fallbackPath="/login"
    >
      {children}
    </ProtectedRoute>
  );
}
