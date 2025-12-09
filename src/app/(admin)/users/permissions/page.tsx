"use client";

import { useState, useEffect } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { rolesService } from "@/lib/roles";
import Link from "next/link";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const data = await rolesService.getAvailablePermissions();
      setPermissions(data as any);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getModuleLabel = (module: string) => {
    const labels: Record<string, string> = {
      users: "Utilisateurs",
      departments: "Départements", 
      positions: "Postes",
      leaves: "Congés",
      payroll: "Paie",
      expenses: "Dépenses",
      system: "Système",
      roles: "Rôles",
      profile: "Profil",
      attendance: "Présence",
      projects: "Projets",
      tasks: "Tâches",
      settings: "Paramètres",
      reports: "Rapports",
      analytics: "Analytiques",
      budget: "Budget",
    };
    return labels[module.toLowerCase()] || module;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  const modules = Object.keys(permissions);

  return (
    <div>
      <PageBreadcrumb pageTitle="Permissions" />

      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-blue-700 dark:text-blue-300">
          Pour modifier les permissions d'un rôle, allez dans{" "}
          <Link href="/users/roles" className="font-medium underline">
            Gestion des rôles
          </Link>{" "}
          et cliquez sur "Modifier".
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <ComponentCard key={module} title={getModuleLabel(module)}>
            <div className="space-y-2">
              {Array.isArray(permissions[module]) ? (
                permissions[module].map((perm: any, idx: number) => (
                  <div
                    key={perm.id || idx}
                    className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded"
                  >
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {perm.name || perm}
                      </p>
                      {perm.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {perm.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">
                  {String(permissions[module])}
                </p>
              )}
            </div>
          </ComponentCard>
        ))}
      </div>

      {modules.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Aucune permission trouvée
        </div>
      )}
    </div>
  );
}
