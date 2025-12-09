"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { rolesService, Role } from "@/lib/roles";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function EditRolePage() {
  const params = useParams();
  const router = useRouter();
  const roleId = Number(params.id);

  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#6b7280",
    icon: "",
    permissions: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, [roleId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [roleData, permissionsData] = await Promise.all([
        rolesService.getRole(roleId),
        rolesService.getAvailablePermissions(),
      ]);
      
      setRole(roleData);
      setPermissions(permissionsData);
      
      setFormData({
        name: roleData.name,
        description: roleData.description || "",
        color: roleData.color || "#6b7280",
        icon: roleData.icon || "",
        permissions: roleData.permissions?.map((p: any) => p.permission?.name || p.name) || [],
      });
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionName: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionName)
        ? prev.permissions.filter((name) => name !== permissionName)
        : [...prev.permissions, permissionName],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Le nom du rôle est requis");
      return;
    }

    try {
      setSaving(true);
      await rolesService.updateRole(roleId, {
        name: formData.name,
        description: formData.description,
        color: formData.color,
        icon: formData.icon,
        permissions: formData.permissions,
      });
      toast.success("Rôle mis à jour avec succès");
      router.push("/users/roles");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
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
      <PageBreadcrumb pageTitle={`Modifier: ${role.name}`} />

      <form onSubmit={handleSubmit} className="space-y-6">
        {role.is_system && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-300">Rôle système</h4>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  Attention : Ce rôle est un rôle système. Modifier ses permissions peut affecter le fonctionnement de l'application.
                  Procédez avec prudence.
                </p>
              </div>
            </div>
          </div>
        )}

        <ComponentCard title="Informations du rôle">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom du rôle *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Couleur
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Permissions">
          <div className="space-y-4">
            {Object.keys(permissions).length > 0 ? (
              Object.entries(permissions).map(([module, perms]: [string, any]) => (
                <div key={module} className="border dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 capitalize">
                    {module}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {perms.map((perm: any) => (
                      <label
                        key={perm.name || perm.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(perm.name)}
                          onChange={() => handlePermissionToggle(perm.name)}
                          className="w-4 h-4 text-primary rounded focus:ring-primary"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {perm.name.split(".")[1] || perm.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                Aucune permission disponible
              </p>
            )}
          </div>
        </ComponentCard>

        <div className="flex gap-3">
          <Link
            href="/users/roles"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
