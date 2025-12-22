"use client";

import { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { permissionsService, MenuItem, Permission, CreateMenuItemDto } from "@/services/permissions.service";
import { useToast } from "@/hooks/useToast";

const SECTION_LABELS: Record<string, string> = {
  main: "Menu Principal",
  advanced: "Modules Avancés",
  hrms: "Modules HRMS",
  employee: "Espace Employé",
};

const ICON_OPTIONS = [
  "🏠", "👤", "👥", "📊", "📈", "📅", "📋", "📁", "📂", "💼",
  "💰", "🏖️", "📢", "⚙️", "🔐", "🔍", "✅", "📝", "🎯", "📦",
  "🏢", "📑", "💳", "🎓", "📚", "🔔", "💬", "📧", "🛠️", "🌐",
];

export default function MenusPage() {
  const toast = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["main"]);

  const [form, setForm] = useState<CreateMenuItemDto>({
    name: "",
    path: "",
    icon: "📋",
    parent_id: undefined,
    permission_id: undefined,
    sort_order: 0,
    is_active: true,
    section: "main",
    description: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [menusData, permsData] = await Promise.all([
        permissionsService.getAllMenuItems(),
        permissionsService.getAllPermissions(),
      ]);
      setMenuItems(menusData);
      setPermissions(permsData);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = (parentId?: number, section?: string) => {
    setEditingMenu(null);
    setForm({
      name: "",
      path: "",
      icon: "📋",
      parent_id: parentId,
      permission_id: undefined,
      sort_order: 0,
      is_active: true,
      section: section || "main",
      description: "",
    });
    setShowModal(true);
  };

  const handleEdit = (menu: MenuItem) => {
    setEditingMenu(menu);
    setForm({
      name: menu.name,
      path: menu.path || "",
      icon: menu.icon || "📋",
      parent_id: menu.parent_id || undefined,
      permission_id: menu.permission_id || undefined,
      sort_order: menu.sort_order,
      is_active: menu.is_active,
      section: menu.section,
      description: menu.description || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error("Le nom du menu est requis");
      return;
    }

    try {
      setSaving(true);
      const data = {
        ...form,
        parent_id: form.parent_id || null,
        permission_id: form.permission_id || null,
      };

      if (editingMenu) {
        await permissionsService.updateMenuItem(editingMenu.id, data);
        toast.success("Menu mis à jour");
      } else {
        await permissionsService.createMenuItem(data);
        toast.success("Menu créé");
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce menu ? Les sous-menus seront déplacés à la racine.")) return;
    try {
      await permissionsService.deleteMenuItem(id);
      toast.success("Menu supprimé");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la suppression");
    }
  };

  const handleToggleActive = async (menu: MenuItem) => {
    try {
      await permissionsService.updateMenuItem(menu.id, { is_active: !menu.is_active });
      toast.success(menu.is_active ? "Menu désactivé" : "Menu activé");
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  // Grouper par section
  const menusBySection = menuItems.reduce((acc, menu) => {
    const section = menu.section || "main";
    if (!acc[section]) acc[section] = [];
    acc[section].push(menu);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Tous les menus plats pour le select parent
  const flatMenus: MenuItem[] = [];
  menuItems.forEach((menu) => {
    flatMenus.push(menu);
    menu.children?.forEach((child) => flatMenus.push(child));
  });

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Gestion des Menus" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📑 Configuration des Menus</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Configurez les menus et associez-les aux permissions
          </p>
        </div>
        <button
          onClick={() => handleCreate()}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
        >
          + Nouveau menu
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>💡 Fonctionnement :</strong> Associez une permission à un menu. 
          Seuls les utilisateurs ayant cette permission verront ce menu dans leur sidebar.
          Les menus sans permission sont visibles par tous.
        </p>
      </div>

      {/* Liste des menus par section */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : Object.keys(menusBySection).length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">📑</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucun menu configuré</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Créez votre premier menu pour commencer
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(SECTION_LABELS).map(([sectionKey, sectionLabel]) => {
            const sectionMenus = menusBySection[sectionKey] || [];
            const isExpanded = expandedSections.includes(sectionKey);

            return (
              <div key={sectionKey} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleSection(sectionKey)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{isExpanded ? "▼" : "▶"}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{sectionLabel}</span>
                    <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                      {sectionMenus.length}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreate(undefined, sectionKey);
                    }}
                    className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20"
                  >
                    + Ajouter
                  </button>
                </button>

                {isExpanded && (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {sectionMenus.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        Aucun menu dans cette section
                      </div>
                    ) : (
                      sectionMenus.map((menu) => (
                        <div key={menu.id}>
                          {/* Menu parent */}
                          <div className={`p-4 flex items-center justify-between ${!menu.is_active ? "opacity-50" : ""}`}>
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{menu.icon || "📋"}</span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 dark:text-white">{menu.name}</span>
                                  {menu.permission && (
                                    <code className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">
                                      {menu.permission.name}
                                    </code>
                                  )}
                                  {!menu.is_active && (
                                    <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Inactif</span>
                                  )}
                                </div>
                                {menu.path && (
                                  <p className="text-xs text-gray-500">{menu.path}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleCreate(menu.id, sectionKey)}
                                className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                                title="Ajouter sous-menu"
                              >
                                ➕
                              </button>
                              <button
                                onClick={() => handleToggleActive(menu)}
                                className={`p-1.5 rounded ${menu.is_active ? "text-yellow-600 hover:bg-yellow-100" : "text-green-600 hover:bg-green-100"}`}
                                title={menu.is_active ? "Désactiver" : "Activer"}
                              >
                                {menu.is_active ? "🔒" : "🔓"}
                              </button>
                              <button
                                onClick={() => handleEdit(menu)}
                                className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                                title="Modifier"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(menu.id)}
                                className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                title="Supprimer"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>

                          {/* Sous-menus */}
                          {menu.children && menu.children.length > 0 && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 border-l-4 border-primary/30 ml-4">
                              {menu.children.map((child) => (
                                <div
                                  key={child.id}
                                  className={`p-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-600 last:border-0 ${!child.is_active ? "opacity-50" : ""}`}
                                >
                                  <div className="flex items-center gap-2 ml-4">
                                    <span className="text-gray-400">└</span>
                                    <span>{child.icon || "📄"}</span>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-900 dark:text-white">{child.name}</span>
                                        {child.permission && (
                                          <code className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1 py-0.5 rounded">
                                            {child.permission.name}
                                          </code>
                                        )}
                                      </div>
                                      {child.path && (
                                        <p className="text-xs text-gray-500">{child.path}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleToggleActive(child)}
                                      className={`p-1 rounded text-sm ${child.is_active ? "text-yellow-600" : "text-green-600"}`}
                                    >
                                      {child.is_active ? "🔒" : "🔓"}
                                    </button>
                                    <button onClick={() => handleEdit(child)} className="p-1 text-blue-600 text-sm">✏️</button>
                                    <button onClick={() => handleDelete(child.id)} className="p-1 text-red-600 text-sm">🗑️</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal création/édition */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingMenu ? "Modifier le menu" : "Nouveau menu"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Icône
                  </label>
                  <select
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-xl"
                  >
                    {ICON_OPTIONS.map((icon) => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="ex: Gestion des congés"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Chemin (URL)
                </label>
                <input
                  type="text"
                  value={form.path}
                  onChange={(e) => setForm({ ...form, path: e.target.value })}
                  placeholder="ex: /leaves ou vide pour menu parent"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">Laissez vide si c'est un menu parent avec sous-menus</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Section
                  </label>
                  <select
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    {Object.entries(SECTION_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Menu parent
                  </label>
                  <select
                    value={form.parent_id || ""}
                    onChange={(e) => setForm({ ...form, parent_id: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="">Aucun (menu racine)</option>
                    {flatMenus
                      .filter((m) => !m.parent_id && m.id !== editingMenu?.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>{m.icon} {m.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Permission requise
                </label>
                <select
                  value={form.permission_id || ""}
                  onChange={(e) => setForm({ ...form, permission_id: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="">Aucune (visible par tous)</option>
                  {permissions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.group_name ? `[${p.group_name}] ` : ""}{p.label || p.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Seuls les utilisateurs avec cette permission verront ce menu</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description courte du menu"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Menu actif</span>
                  </label>
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
                  {saving ? "Enregistrement..." : editingMenu ? "Mettre à jour" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
