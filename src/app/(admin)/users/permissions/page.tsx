"use client";

import { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { permissionsService, Permission, CreatePermissionDto } from "@/services/permissions.service";
import { useToast } from "@/hooks/useToast";

export default function PermissionsPage() {
  const toast = useToast();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGroup, setFilterGroup] = useState("");

  const [form, setForm] = useState<CreatePermissionDto>({
    name: "",
    label: "",
    description: "",
    group_name: "",
    group_icon: "📋",
    sort_order: 0,
  });

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const data = await permissionsService.getAllPermissions();
      setPermissions(data);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPermission(null);
    setForm({
      name: "",
      label: "",
      description: "",
      group_name: "",
      group_icon: "📋",
      sort_order: 0,
    });
    setShowModal(true);
  };

  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    setForm({
      name: permission.name,
      label: permission.label || "",
      description: permission.description || "",
      group_name: permission.group_name || "",
      group_icon: permission.group_icon || "📋",
      sort_order: permission.sort_order || 0,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error("Le nom de la permission est requis");
      return;
    }

    try {
      setSaving(true);
      if (editingPermission) {
        await permissionsService.updatePermission(editingPermission.id, form);
        toast.success("Permission mise à jour");
      } else {
        await permissionsService.createPermission(form);
        toast.success("Permission créée");
      }
      setShowModal(false);
      loadPermissions();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette permission ? Cette action est irréversible.")) return;
    try {
      await permissionsService.deletePermission(id);
      toast.success("Permission supprimée");
      loadPermissions();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la suppression");
    }
  };

  const handleSeedPermissions = async () => {
    if (!confirm("Initialiser les permissions par défaut ?")) return;
    try {
      await permissionsService.seedDefaultPermissions();
      toast.success("Permissions initialisées");
      loadPermissions();
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    }
  };

  // Grouper les permissions
  const groups = [...new Set(permissions.map((p) => p.group_name || "Autres"))];
  
  const filteredPermissions = permissions.filter((p) => {
    const matchSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.label?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGroup = !filterGroup || (p.group_name || "Autres") === filterGroup;
    return matchSearch && matchGroup;
  });

  const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
    const group = perm.group_name || "Autres";
    if (!acc[group]) {
      acc[group] = { icon: perm.group_icon || "📋", permissions: [] };
    }
    acc[group].permissions.push(perm);
    return acc;
  }, {} as Record<string, { icon: string; permissions: Permission[] }>);

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Gestion des Permissions" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🔐 Permissions</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez les permissions et attribuez-les aux rôles
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSeedPermissions}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            🔄 Initialiser
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
          >
            + Nouvelle permission
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm flex-1 min-w-[200px]"
        />
        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
        >
          <option value="">Tous les groupes</option>
          {groups.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {/* Liste des permissions par groupe */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : Object.keys(groupedPermissions).length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune permission</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Cliquez sur "Initialiser" pour créer les permissions par défaut
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(groupedPermissions).map(([groupName, group]) => (
            <div key={groupName} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>{group.icon}</span>
                  {groupName}
                  <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                    {group.permissions.length}
                  </span>
                </h3>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {group.permissions.map((perm) => (
                  <div key={perm.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                            {perm.name}
                          </code>
                          {perm._count && perm._count.role_permission > 0 && (
                            <span className="text-xs text-gray-500">
                              ({perm._count.role_permission} rôle{perm._count.role_permission > 1 ? "s" : ""})
                            </span>
                          )}
                        </div>
                        {perm.label && (
                          <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                            {perm.label}
                          </p>
                        )}
                        {perm.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {perm.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => handleEdit(perm)}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(perm.id)}
                          className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal création/édition */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg m-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingPermission ? "Modifier la permission" : "Nouvelle permission"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom technique *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="ex: announcements.manage"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Format: module.action (ex: users.view)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Libellé
                </label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="ex: Gérer les annonces"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Groupe
                  </label>
                  <input
                    type="text"
                    value={form.group_name}
                    onChange={(e) => setForm({ ...form, group_name: e.target.value })}
                    placeholder="ex: Annonces"
                    list="groups-list"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                  <datalist id="groups-list">
                    {groups.map((g) => (
                      <option key={g} value={g} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Icône
                  </label>
                  <input
                    type="text"
                    value={form.group_icon}
                    onChange={(e) => setForm({ ...form, group_icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? "Enregistrement..." : editingPermission ? "Mettre à jour" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
