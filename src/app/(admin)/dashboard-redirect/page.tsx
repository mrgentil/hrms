'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/hooks/useUserRole';

export default function DashboardRedirect() {
  const router = useRouter();
  const { role: userRole, loading } = useUserRole();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (userRole) {
      // Rediriger selon le rôle de l'utilisateur
      if (userRole.isEmployee && !userRole.isManager && !userRole.isHR && !userRole.isAdmin && !userRole.isSuperAdmin) {
        // Employé simple -> Dashboard employé
        router.replace('/employee-dashboard');
      } else if (userRole.isManager || userRole.isHR || userRole.isAdmin || userRole.isSuperAdmin) {
        // Manager, RH, Admin -> Dashboard admin existant
        router.replace('/');
      } else {
        // Par défaut -> Dashboard employé
        router.replace('/employee-dashboard');
      }
    } else {
      router.replace('/signin');
    }
  }, [userRole, loading, router]);

  // Affichage de chargement pendant la redirection
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirection vers votre espace...</p>
      </div>
    </div>
  );
}
