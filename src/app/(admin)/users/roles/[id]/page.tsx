"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { rolesService, Role } from "@/lib/roles";
import Link from "next/link";

export default function RoleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roleId = Number(params.id);

  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadRole();
  }, [roleId]);

  const loadRole = async () => {
    try {
      setLoading(true);
      const data = await rolesService.getRole(roleId);
      setRole(data);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement du rôle");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          {error || "Rôle non trouvé"}
        </div>
        <Link href="/users/roles" className="mt-4 inline-block text-primary hover:underline">
          ← Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle={role.name} />

      <div className="space-y-6">
        <ComponentCard title="Détails du rôle">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                style={{ backgroundColor: role.color || "#6b7280" }}
              >
                {role.icon ? (
                  <span>{role.icon}</span>
                ) : (
                  role.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {role.name}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  {role.description || "Aucune description"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-gray-700">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Type</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {role.is_system ? "Rôle système" : "Rôle personnalisé"}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Utilisateurs</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {role._count?.users || 0} utilisateur(s)
                </p>
              </div>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Permissions">
          <div className="space-y-2">
            {role.permissions && role.permissions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {role.permissions.map((perm: any) => (
                  <span
                    key={perm.permission?.id || perm.id}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {perm.permission?.name || perm.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Aucune permission assignée</p>
            )}
          </div>
        </ComponentCard>

        <div className="flex gap-3">
          <Link
            href="/users/roles"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            ← Retour
          </Link>
          <Link
            href={`/users/roles/${role.id}/edit`}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Modifier les permissions
          </Link>
        </div>
      </div>
    </div>
  );
}
