"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PerformanceService, { Review, Campaign } from "@/services/performance.service";

const STATUS_LABELS: Record<string, string> = {
  PENDING_SELF: "Auto-évaluation",
  PENDING_MANAGER: "Évaluation manager",
  PENDING_FEEDBACK: "Feedback 360",
  PENDING_FINAL: "Finalisation",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING_SELF: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  PENDING_MANAGER: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  PENDING_FEEDBACK: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  PENDING_FINAL: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export default function ReviewsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"my" | "team" | "campaigns">("my");
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [teamReviews, setTeamReviews] = useState<Review[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "ANNUAL" as Campaign["type"],
    year: new Date().getFullYear(),
    start_date: "",
    end_date: "",
    self_review_deadline: "",
    manager_review_deadline: "",
    weight_self: 20,
    weight_manager: 50,
    weight_feedback360: 30,
  });
  const [submitting, setSubmitting] = useState(false);

  const isManager = user?.role === "ROLE_MANAGER" || 
                   user?.role === "ROLE_RH" || 
                   user?.role === "ROLE_ADMIN" || 
                   user?.role === "ROLE_SUPER_ADMIN";

  const isHR = user?.role === "ROLE_RH" || 
               user?.role === "ROLE_ADMIN" || 
               user?.role === "ROLE_SUPER_ADMIN";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [myRes, campaignsRes] = await Promise.all([
        PerformanceService.getMyReviews(),
        isHR ? PerformanceService.getCampaigns() : Promise.resolve({ data: [] }),
      ]);
      setMyReviews(myRes.data || []);
      setCampaigns(campaignsRes.data || []);

      if (isManager) {
        const teamRes = await PerformanceService.getTeamReviews();
        setTeamReviews(teamRes.data || []);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des évaluations");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    const total = formData.weight_self + formData.weight_manager + formData.weight_feedback360;
    if (total !== 100) {
      toast.error("La somme des pondérations doit être égale à 100%");
      return;
    }

    try {
      setSubmitting(true);
      await PerformanceService.createCampaign(formData);
      toast.success("Campagne créée avec succès");
      setShowCampaignForm(false);
      setFormData({
        title: "",
        description: "",
        type: "ANNUAL",
        year: new Date().getFullYear(),
        start_date: "",
        end_date: "",
        self_review_deadline: "",
        manager_review_deadline: "",
        weight_self: 20,
        weight_manager: 50,
        weight_feedback360: 30,
      });
      loadData();
    } catch (error) {
      toast.error("Erreur lors de la création de la campagne");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLaunchCampaign = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir lancer cette campagne ?")) return;
    try {
      await PerformanceService.launchCampaign(id);
      toast.success("Campagne lancée");
      loadData();
    } catch (error) {
      toast.error("Erreur lors du lancement");
    }
  };

  const handleCloseCampaign = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir clôturer cette campagne ?")) return;
    try {
      await PerformanceService.closeCampaign(id);
      toast.success("Campagne clôturée");
      loadData();
    } catch (error) {
      toast.error("Erreur lors de la clôture");
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const getRatingStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm font-medium">{rating}/5</span>
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
      <PageBreadcrumb pageTitle="Évaluations de Performance" />

      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("my")}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === "my"
                ? "bg-primary text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            📝 Mes Évaluations ({myReviews.length})
          </button>
          {isManager && (
            <button
              onClick={() => setActiveTab("team")}
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                activeTab === "team"
                  ? "bg-primary text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              👥 Mon Équipe ({teamReviews.length})
            </button>
          )}
          {isHR && (
            <button
              onClick={() => setActiveTab("campaigns")}
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                activeTab === "campaigns"
                  ? "bg-primary text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              🎯 Campagnes ({campaigns.length})
            </button>
          )}
        </div>

        {/* My Reviews Tab */}
        {activeTab === "my" && (
          <div className="space-y-4">
            {myReviews.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="text-5xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Aucune évaluation en cours
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Vous serez notifié lorsqu&apos;une nouvelle évaluation sera disponible.
                </p>
              </div>
            ) : (
              myReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {review.campaign?.title}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[review.status]}`}>
                          {STATUS_LABELS[review.status]}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>📅 {review.campaign?.year}</span>
                        <span>👤 Manager: {review.manager?.full_name}</span>
                        {review.campaign?.self_review_deadline && (
                          <span>⏰ Deadline: {formatDate(review.campaign.self_review_deadline)}</span>
                        )}
                      </div>
                      {review.final_rating && (
                        <div className="mt-3">{getRatingStars(review.final_rating)}</div>
                      )}
                    </div>
                    <Link
                      href={`/performance/reviews/${review.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      {review.status === "PENDING_SELF" ? "Compléter" : "Voir détails"}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Team Reviews Tab */}
        {activeTab === "team" && isManager && (
          <div className="space-y-4">
            {teamReviews.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="text-5xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Aucune évaluation d&apos;équipe
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Les évaluations de votre équipe apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Employé</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Campagne</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Auto-éval</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {teamReviews.map((review) => (
                      <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                              {review.employee?.full_name?.charAt(0) || "?"}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{review.employee?.full_name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{review.employee?.position?.title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{review.campaign?.title}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[review.status]}`}>
                            {STATUS_LABELS[review.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4">{review.self_rating ? getRatingStars(review.self_rating) : "-"}</td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/performance/reviews/${review.id}`}
                            className="text-primary hover:text-primary/80 font-medium text-sm"
                          >
                            {review.status === "PENDING_MANAGER" ? "Évaluer" : "Voir"}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === "campaigns" && isHR && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() => setShowCampaignForm(!showCampaignForm)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouvelle campagne
              </button>
            </div>

            {/* Campaign Form */}
            {showCampaignForm && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Créer une campagne</h3>
                <form onSubmit={handleCreateCampaign} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                        placeholder="Ex: Évaluation Annuelle 2024"
                      />
                    </div>
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Année</label>
                      <input
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
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
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline auto-éval</label>
                      <input
                        type="date"
                        value={formData.self_review_deadline}
                        onChange={(e) => setFormData({ ...formData, self_review_deadline: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pondération du score final (total = 100%)</label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-gray-500">Auto-éval (%)</label>
                        <input
                          type="number"
                          value={formData.weight_self}
                          onChange={(e) => setFormData({ ...formData, weight_self: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Manager (%)</label>
                        <input
                          type="number"
                          value={formData.weight_manager}
                          onChange={(e) => setFormData({ ...formData, weight_manager: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Feedback 360 (%)</label>
                        <input
                          type="number"
                          value={formData.weight_feedback360}
                          onChange={(e) => setFormData({ ...formData, weight_feedback360: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                      {submitting ? "Création..." : "Créer"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCampaignForm(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Campaigns List */}
            <div className="grid gap-4">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{campaign.title}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaign.status === "ACTIVE" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                          campaign.status === "DRAFT" ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300" :
                          campaign.status === "CLOSED" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {campaign.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>📅 {campaign.year}</span>
                        <span>📊 {campaign._count?.reviews || 0} reviews</span>
                        <span>⚖️ {campaign.weight_self}/{campaign.weight_manager}/{campaign.weight_feedback360}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {campaign.status === "DRAFT" && (
                        <button
                          onClick={() => handleLaunchCampaign(campaign.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          🚀 Lancer
                        </button>
                      )}
                      {campaign.status === "ACTIVE" && (
                        <button
                          onClick={() => handleCloseCampaign(campaign.id)}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                        >
                          🔒 Clôturer
                        </button>
                      )}
                      <Link
                        href={`/performance/campaigns/${campaign.id}`}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Détails
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
