"use client";

import React, { useState, useEffect } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/useToast";
import {
  announcementsService,
  Announcement,
  AnnouncementType,
  AnnouncementPriority,
  CreateAnnouncementDto,
} from "@/services/announcements.service";
import { departmentsService, Department } from "@/services/departments.service";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

const TYPE_LABELS: Record<AnnouncementType, string> = {
  INFO: "Information",
  EVENT: "Événement",
  POLICY: "Politique",
  CELEBRATION: "Célébration",
  URGENT: "Urgent",
  MAINTENANCE: "Maintenance",
};

const TYPE_COLORS: Record<AnnouncementType, string> = {
  INFO: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  EVENT: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  POLICY: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  CELEBRATION: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  MAINTENANCE: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
};

const PRIORITY_LABELS: Record<AnnouncementPriority, string> = {
  LOW: "Basse",
  NORMAL: "Normale",
  HIGH: "Haute",
  CRITICAL: "Critique",
};

export default function AnnouncementsPage() {
  const { role: userRole } = useUserRole();
  const toast = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);

  // Filtres
  const [filterType, setFilterType] = useState("");
  const [filterPublished, setFilterPublished] = useState("");
  const [showExpired, setShowExpired] = useState(true);

  // Formulaire
  const [form, setForm] = useState<CreateAnnouncementDto>({
    title: "",
    content: "",
    type: "INFO",
    priority: "NORMAL",
    is_published: false,
    department_id: undefined,
    expire_date: undefined,
  });

  const isAdmin = userRole?.role === "ROLE_ADMIN" || userRole?.role === "ROLE_SUPER_ADMIN" || userRole?.role === "ROLE_RH";

  useEffect(() => {
    loadData();
  }, [filterType, filterPublished, showExpired]);

  useEffect(() => {
    if (isAdmin) {
      departmentsService.getDepartments().then(setDepartments).catch(console.error);
    }
  }, [isAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log("Loading announcements with filters:", { filterType, filterPublished, showExpired });
      const data = await announcementsService.getAll({
        type: filterType || undefined,
        is_published: filterPublished === "true" ? true : filterPublished === "false" ? false : undefined,
        include_expired: showExpired,
      });
      console.log("Announcements loaded:", data);
      setAnnouncements(data);
    } catch (error) {
      console.error("Erreur chargement annonces:", error);
      toast.error("Erreur lors du chargement des annonces");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAnnouncement(null);
    setForm({
      title: "",
      content: "",
      type: "INFO",
      priority: "NORMAL",
      is_published: false,
      department_id: undefined,
      expire_date: undefined,
    });
    setShowModal(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setForm({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      is_published: announcement.is_published,
      department_id: announcement.department_id || undefined,
      expire_date: announcement.expire_date?.split("T")[0] || undefined,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setSaving(true);
      if (editingAnnouncement) {
        await announcementsService.update(editingAnnouncement.id, form);
        toast.success("Annonce mise à jour");
      } else {
        await announcementsService.create(form);
        toast.success("Annonce créée");
      }
      setShowModal(false);
      loadData();
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (id: number, publish: boolean) => {
    try {
      if (publish) {
        await announcementsService.publish(id);
        toast.success("Annonce publiée");
      } else {
        await announcementsService.unpublish(id);
        toast.success("Annonce dépubliée");
      }
      loadData();
    } catch (error: any) {
      toast.error(error?.message || "Erreur");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette annonce ?")) return;
    try {
      await announcementsService.delete(id);
      toast.success("Annonce supprimée");
      loadData();
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de la suppression");
    }
  };

  const isExpired = (date: string | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Annonces" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📢 Annonces</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez les communications de l'entreprise
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
          >
            + Nouvelle annonce
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
          >
            <option value="">Tous les types</option>
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={filterPublished}
            onChange={(e) => setFilterPublished(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
          >
            <option value="">Tous les statuts</option>
            <option value="true">Publiées</option>
            <option value="false">Brouillons</option>
          </select>

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={showExpired}
              onChange={(e) => setShowExpired(e.target.checked)}
              className="rounded"
            />
            Inclure les expirées
          </label>
        </div>
      </div>

      {/* Liste des annonces */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune annonce</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {isAdmin ? "Créez votre première annonce" : "Aucune annonce pour le moment"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 ${
                announcement.type === "URGENT" ? "border-red-500" :
                announcement.type === "EVENT" ? "border-purple-500" :
                announcement.type === "CELEBRATION" ? "border-yellow-500" :
                announcement.type === "MAINTENANCE" ? "border-orange-500" :
                "border-blue-500"
              } ${isExpired(announcement.expire_date) ? "opacity-60" : ""}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${TYPE_COLORS[announcement.type]}`}>
                      {TYPE_LABELS[announcement.type]}
                    </span>
                    {!announcement.is_published && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                        Brouillon
                      </span>
                    )}
                    {isExpired(announcement.expire_date) && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400">
                        Expirée
                      </span>
                    )}
                    {announcement.department && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400">
                        {announcement.department.department_name}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {announcement.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {announcement.content}
                  </p>
                  
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Par {announcement.author?.full_name || "Admin"}</span>
                    <span>•</span>
                    <span>{new Date(announcement.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}</span>
                    {announcement.expire_date && (
                      <>
                        <span>•</span>
                        <span>Expire le {new Date(announcement.expire_date).toLocaleDateString("fr-FR")}</span>
                      </>
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex sm:flex-col gap-2">
                    <button
                      onClick={() => handlePublish(announcement.id, !announcement.is_published)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                        announcement.is_published
                          ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {announcement.is_published ? "Dépublier" : "Publier"}
                    </button>
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal création/édition */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingAnnouncement ? "Modifier l'annonce" : "Nouvelle annonce"}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contenu *
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as AnnouncementType })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    {Object.entries(TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priorité
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as AnnouncementPriority })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Département (optionnel)
                  </label>
                  <select
                    value={form.department_id || ""}
                    onChange={(e) => setForm({ ...form, department_id: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="">Tous les départements</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.department_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date d'expiration
                  </label>
                  <input
                    type="date"
                    value={form.expire_date || ""}
                    onChange={(e) => setForm({ ...form, expire_date: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={form.is_published}
                  onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_published" className="text-sm text-gray-700 dark:text-gray-300">
                  Publier immédiatement
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? "Enregistrement..." : editingAnnouncement ? "Mettre à jour" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
