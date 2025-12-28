"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PerformanceService, { Objective } from "@/services/performance.service";

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Non démarré",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL: "Individuel",
  TEAM: "Équipe",
  COMPANY: "Entreprise",
};

export default function ObjectivesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"my" | "team">("my");
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [teamObjectives, setTeamObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "INDIVIDUAL" as Objective["type"],
    category: "",
    metric_type: "PERCENTAGE" as Objective["metric_type"],
    target_value: 100,
    start_date: "",
    due_date: "",
    weight: 100,
  });
  const [submitting, setSubmitting] = useState(false);

  const isManager = user?.role === "ROLE_MANAGER" || 
                   user?.role === "ROLE_RH" || 
                   user?.role === "ROLE_ADMIN" || 
                   user?.role === "ROLE_SUPER_ADMIN";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const myRes = await PerformanceService.getMyObjectives();
      setObjectives(myRes.data || []);

      if (isManager) {
        const teamRes = await PerformanceService.getTeamObjectives();
        setTeamObjectives(teamRes.data || []);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des objectifs");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await PerformanceService.updateObjective(editingId, formData);
        toast.success("Objectif mis à jour");
      } else {
        await PerformanceService.createObjective({
          ...formData,
          employee_id: user?.id,
        });
        toast.success("Objectif créé");
      }
      resetForm();
      loadData();
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (obj: Objective) => {
    setEditingId(obj.id);
    setFormData({
      title: obj.title,
      description: obj.description || "",
      type: obj.type,
      category: obj.category || "",
      metric_type: obj.metric_type,
      target_value: obj.target_value || 100,
      start_date: obj.start_date?.split("T")[0] || "",
      due_date: obj.due_date?.split("T")[0] || "",
      weight: obj.weight,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cet objectif ?")) return;
    try {
      await PerformanceService.deleteObjective(id);
      toast.success("Objectif supprimé");
      loadData();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleUpdateProgress = async (id: number, progress: number) => {
    try {
      await PerformanceService.updateProgress(id, { progress });
      toast.success("Progression mise à jour");
      loadData();
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: "",
      description: "",
      type: "INDIVIDUAL",
      category: "",
      metric_type: "PERCENTAGE",
      target_value: 100,
      start_date: "",
      due_date: "",
      weight: 100,
    });
  };

  const getProgressPercent = (obj: Objective) => {
    if (obj.target_value && obj.current_value) {
      return Math.min(100, Math.round((Number(obj.current_value) / Number(obj.target_value)) * 100));
    }
    return obj.self_progress || 0;
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const ObjectiveCard = ({ obj, showEmployee = false }: { obj: Objective; showEmployee?: boolean }) => {
    const progress = getProgressPercent(obj);
    const isOverdue = obj.due_date && new Date(obj.due_date) < new Date() && obj.status !== "COMPLETED";

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">{obj.title}</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[obj.status]}`}>
                {STATUS_LABELS[obj.status]}
              </span>
            </div>
            {showEmployee && obj.employee && (
              <p className="text-sm text-primary font-medium">{obj.employee.full_name}</p>
            )}
            {obj.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{obj.description}</p>
            )}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handleEdit(obj)}
              className="p-1.5 text-gray-400 hover:text-primary rounded"
              title="Modifier"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={() => handleDelete(obj.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 rounded"
              title="Supprimer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
          <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{TYPE_LABELS[obj.type]}</span>
          {obj.category && <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{obj.category}</span>}
          <span className={isOverdue ? "text-red-500 font-medium" : ""}>
            📅 {formatDate(obj.due_date)} {isOverdue && "(En retard)"}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Progression</span>
            <span className="font-medium text-gray-900 dark:text-white">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                progress >= 100 ? "bg-green-500" : progress >= 50 ? "bg-blue-500" : "bg-yellow-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Quick Progress Update */}
        {obj.status !== "COMPLETED" && obj.status !== "CANCELLED" && (
          <div className="flex gap-2">
            {[25, 50, 75, 100].map((val) => (
              <button
                key={val}
                onClick={() => handleUpdateProgress(obj.id, val)}
                className={`flex-1 py-1 text-xs rounded transition-colors ${
                  progress >= val
                    ? "bg-primary/20 text-primary"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {val}%
              </button>
            ))}
          </div>
        )}

        {/* Key Results */}
        {obj.key_results && obj.key_results.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Key Results</h4>
            <div className="space-y-2">
              {obj.key_results.map((kr) => (
                <div key={kr.id} className="flex items-center gap-2 text-sm">
                  <span className={`w-2 h-2 rounded-full ${
                    kr.status === "COMPLETED" ? "bg-green-500" : 
                    kr.status === "IN_PROGRESS" ? "bg-blue-500" : "bg-gray-300"
                  }`} />
                  <span className="flex-1 text-gray-700 dark:text-gray-300">{kr.title}</span>
                  {kr.target_value && (
                    <span className="text-xs text-gray-500">
                      {kr.current_value || 0}/{kr.target_value} {kr.unit || ""}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Objectifs (OKR/KPI)" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("my")}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors ${
                activeTab === "my"
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}
            >
              🎯 Mes Objectifs ({objectives.length})
            </button>
            {isManager && (
              <button
                onClick={() => setActiveTab("team")}
                className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors ${
                  activeTab === "team"
                    ? "bg-primary text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                👥 Équipe ({teamObjectives.length})
              </button>
            )}
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvel objectif
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {editingId ? "Modifier l'objectif" : "Créer un objectif"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    placeholder="Ex: Augmenter le taux de conversion de 20%"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Objective["type"] })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="INDIVIDUAL">Individuel</option>
                    <option value="TEAM">Équipe</option>
                    <option value="COMPANY">Entreprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    placeholder="Ex: Ventes, Technique, Management..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date début</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date fin</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type de métrique</label>
                  <select
                    value={formData.metric_type}
                    onChange={(e) => setFormData({ ...formData, metric_type: e.target.value as Objective["metric_type"] })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="PERCENTAGE">Pourcentage</option>
                    <option value="NUMBER">Nombre</option>
                    <option value="CURRENCY">Montant</option>
                    <option value="BOOLEAN">Oui/Non</option>
                    <option value="CUSTOM">Personnalisé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valeur cible</label>
                  <input
                    type="number"
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? "Enregistrement..." : editingId ? "Mettre à jour" : "Créer"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Objectives Grid */}
        {activeTab === "my" && (
          objectives.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aucun objectif</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Créez votre premier objectif pour commencer à suivre votre progression.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {objectives.map((obj) => (
                <ObjectiveCard key={obj.id} obj={obj} />
              ))}
            </div>
          )
        )}

        {activeTab === "team" && isManager && (
          teamObjectives.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aucun objectif d&apos;équipe</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Les objectifs de votre équipe apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamObjectives.map((obj) => (
                <ObjectiveCard key={obj.id} obj={obj} showEmployee />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
