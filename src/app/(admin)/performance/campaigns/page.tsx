"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PerformanceService, { Campaign } from "@/services/performance.service";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  ACTIVE: "Active",
  CLOSED: "Clôturée",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CLOSED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

export default function CampaignsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    year: new Date().getFullYear(),
    type: "ANNUAL" as Campaign["type"],
    start_date: "",
    end_date: "",
    self_review_deadline: "",
    manager_review_deadline: "",
    weight_self: 20,
    weight_manager: 50,
    weight_feedback360: 30,
  });

  const isHR = user?.role === "ROLE_RH" ||
    user?.role === "ROLE_ADMIN" ||
    user?.role === "ROLE_SUPER_ADMIN";

  useEffect(() => {
    if (!isHR) return;
    loadCampaigns();
  }, [isHR]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const res = await PerformanceService.getCampaigns();
      setCampaigns(res.data || []);
    } catch (error) {
      toast.error("Erreur lors du chargement des campagnes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalWeight = formData.weight_self + formData.weight_manager + formData.weight_feedback360;

    if (totalWeight !== 100) {
      toast.error(`La somme des pondérations doit être 100% (actuellement ${totalWeight}%)`);
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await PerformanceService.updateCampaign(editingId, formData);
        toast.success("Campagne mise à jour");
      } else {
        await PerformanceService.createCampaign(formData);
        toast.success("Campagne créée");
      }
      resetForm();
      loadCampaigns();
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingId(campaign.id);
    setFormData({
      title: campaign.title,
      year: campaign.year,
      type: campaign.type,
      start_date: campaign.start_date?.split("T")[0] || "",
      end_date: campaign.end_date?.split("T")[0] || "",
      self_review_deadline: campaign.self_review_deadline?.split("T")[0] || "",
      manager_review_deadline: campaign.manager_review_deadline?.split("T")[0] || "",
      weight_self: campaign.weight_self || 20,
      weight_manager: campaign.weight_manager || 50,
      weight_feedback360: campaign.weight_feedback360 || 30,
    });
    setShowForm(true);
  };

  const handleLaunch = async (id: number) => {
    if (!confirm("Lancer cette campagne ? Les employés seront notifiés.")) return;
    try {
      await PerformanceService.launchCampaign(id);
      toast.success("Campagne lancée avec succès");
      loadCampaigns();
    } catch (error) {
      toast.error("Erreur lors du lancement");
    }
  };

  const handleClose = async (id: number) => {
    if (!confirm("Clôturer cette campagne ? Les scores finaux seront calculés.")) return;
    try {
      await PerformanceService.closeCampaign(id);
      toast.success("Campagne clôturée");
      loadCampaigns();
    } catch (error) {
      toast.error("Erreur lors de la clôture");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette campagne ? Cette action est irréversible.")) return;
    try {
      await PerformanceService.deleteCampaign(id);
      toast.success("Campagne supprimée");
      loadCampaigns();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: "",
      year: new Date().getFullYear(),
      type: "ANNUAL",
      start_date: "",
      end_date: "",
      self_review_deadline: "",
      manager_review_deadline: "",
      weight_self: 20,
      weight_manager: 50,
      weight_feedback360: 30,
    });
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const getTotalWeight = () => {
    return formData.weight_self + formData.weight_manager + formData.weight_feedback360;
  };

  if (!isHR) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Accès restreint</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Cette page est réservée aux RH et administrateurs.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Gestion des Campagnes" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Créez et gérez les campagnes d&apos;évaluation de performance
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle campagne
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{campaigns.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total campagnes</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-500">{campaigns.filter(c => c.status === "ACTIVE").length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Actives</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-500">{campaigns.filter(c => c.status === "DRAFT").length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Brouillons</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-500">{campaigns.filter(c => c.status === "CLOSED").length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Clôturées</div>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {editingId ? "Modifier la campagne" : "Créer une campagne"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Titre de la campagne *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    placeholder="Ex: Évaluation annuelle 2025"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Année
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    min={2020}
                    max={2030}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Campaign["type"] })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="ANNUAL">Annuelle</option>
                    <option value="SEMI_ANNUAL">Semestrielle</option>
                    <option value="QUARTERLY">Trimestrielle</option>
                    <option value="PROBATION">Période d&apos;essai</option>
                    <option value="PROJECT">Projet</option>
                  </select>
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
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Deadlines */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date limite auto-évaluation
                  </label>
                  <input
                    type="date"
                    value={formData.self_review_deadline}
                    onChange={(e) => setFormData({ ...formData, self_review_deadline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date limite évaluation manager
                  </label>
                  <input
                    type="date"
                    value={formData.manager_review_deadline}
                    onChange={(e) => setFormData({ ...formData, manager_review_deadline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Weights */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Pondération du score final</h4>
                  <span className={`text-sm font-bold ${getTotalWeight() === 100 ? "text-green-500" : "text-red-500"}`}>
                    Total: {getTotalWeight()}%
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Auto-évaluation</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={formData.weight_self}
                        onChange={(e) => setFormData({ ...formData, weight_self: parseInt(e.target.value) })}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-10 text-right">{formData.weight_self}%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Manager</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={formData.weight_manager}
                        onChange={(e) => setFormData({ ...formData, weight_manager: parseInt(e.target.value) })}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-10 text-right">{formData.weight_manager}%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Feedback 360°</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={formData.weight_feedback360}
                        onChange={(e) => setFormData({ ...formData, weight_feedback360: parseInt(e.target.value) })}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-10 text-right">{formData.weight_feedback360}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting || getTotalWeight() !== 100}
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

        {/* Campaigns List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Campagne</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Période</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Évaluations</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      Aucune campagne. Créez votre première campagne d&apos;évaluation.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-4 py-3">
                        <Link href={`/performance/campaigns/${campaign.id}`} className="font-medium text-gray-900 dark:text-white hover:text-primary transition-colors">
                          {campaign.title}
                        </Link>
                        <div className="text-sm text-gray-500">{campaign.year}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {campaign.type === "ANNUAL" && "Annuelle"}
                        {campaign.type === "SEMI_ANNUAL" && "Semestrielle"}
                        {campaign.type === "QUARTERLY" && "Trimestrielle"}
                        {campaign.type === "PROBATION" && "Période d'essai"}
                        {campaign.type === "PROJECT" && "Projet"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(campaign.start_date)} → {formatDate(campaign.end_date)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[campaign.status]}`}>
                          {STATUS_LABELS[campaign.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {campaign._count?.reviews || 0} reviews
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {campaign.status === "DRAFT" && (
                            <>
                              <button
                                onClick={() => handleEdit(campaign)}
                                className="p-1.5 text-gray-400 hover:text-primary rounded"
                                title="Modifier"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleLaunch(campaign.id)}
                                className="p-1.5 text-gray-400 hover:text-green-500 rounded"
                                title="Lancer"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(campaign.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                                title="Supprimer"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                          {campaign.status === "ACTIVE" && (
                            <button
                              onClick={() => handleClose(campaign.id)}
                              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded hover:bg-blue-200"
                            >
                              Clôturer
                            </button>
                          )}
                          {campaign.status === "CLOSED" && (
                            <span className="text-xs text-gray-400">Terminée</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
