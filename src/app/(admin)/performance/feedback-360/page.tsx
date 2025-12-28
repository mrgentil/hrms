"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PerformanceService, { FeedbackRequest, Review } from "@/services/performance.service";
import { employeesService } from "@/services/employees.service";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  SUBMITTED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  DECLINED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function Feedback360Page() {
  const { user } = useAuth();
  const toast = useToast();
  const [pendingFeedback, setPendingFeedback] = useState<FeedbackRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState<number | null>(null);
  const [feedbackData, setFeedbackData] = useState({
    rating: 4,
    comments: "",
  });

  // Request Form State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [requestData, setRequestData] = useState({
    review_id: 0,
    reviewer_ids: [] as number[],
    is_anonymous: true
  });
  const [requesting, setRequesting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await PerformanceService.getPendingFeedback();
      setPendingFeedback(res.data || []);
    } catch (error) {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };
  // Fetch active reviews and employees when opening request modal or on init
  const loadRequestData = async () => {
    try {
      const [reviewsRes, empRes] = await Promise.all([
        PerformanceService.getMyReviews(),
        employeesService.getAllEmployees()
      ]);
      // Filter active reviews
      const active = (reviewsRes.data || []).filter((r: Review) =>
        r.status === 'PENDING_SELF' || r.status === 'PENDING_MANAGER'
      );
      setMyReviews(active);
      setEmployees((empRes || []).filter((e: any) => e.id !== user?.id && e.active));

      // Auto-select first review if exists
      if (active.length > 0) {
        setRequestData(prev => ({ ...prev, review_id: active[0].id }));
      }
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les données");
    }
  };

  const handleOpenRequest = () => {
    loadRequestData();
    setShowRequestModal(true);
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestData.review_id) {
      toast.error("Aucune évaluation active sélectionnée");
      return;
    }
    if (requestData.reviewer_ids.length === 0) {
      toast.error("Sélectionnez au moins un évaluateur");
      return;
    }

    try {
      setRequesting(true);
      await PerformanceService.requestFeedback({
        review_id: requestData.review_id,
        reviewer_ids: requestData.reviewer_ids,
        is_anonymous: requestData.is_anonymous
      });
      toast.success("Demandes envoyées !");
      setShowRequestModal(false);
      setRequestData({ review_id: 0, reviewer_ids: [], is_anonymous: true });
    } catch (error) {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setRequesting(false);
    }
  };

  const toggleReviewer = (empId: number) => {
    setRequestData(prev => {
      const exists = prev.reviewer_ids.includes(empId);
      return {
        ...prev,
        reviewer_ids: exists
          ? prev.reviewer_ids.filter(id => id !== empId)
          : [...prev.reviewer_ids, empId]
      };
    });
  };

  const handleSubmitFeedback = async (id: number) => {
    if (!feedbackData.comments.trim()) {
      toast.error("Veuillez ajouter un commentaire");
      return;
    }

    try {
      setSubmittingId(id);
      await PerformanceService.submitFeedback(id, feedbackData);
      toast.success("Feedback envoyé avec succès");
      setShowFeedbackForm(null);
      setFeedbackData({ rating: 4, comments: "" });
      loadData();
    } catch (error) {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDecline = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir décliner cette demande de feedback ?")) return;
    try {
      setSubmittingId(id);
      await PerformanceService.declineFeedback(id);
      toast.success("Demande déclinée");
      loadData();
    } catch (error) {
      toast.error("Erreur");
    } finally {
      setSubmittingId(null);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("fr-FR");
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
      <PageBreadcrumb pageTitle="Feedback 360°" />

      <div className="space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                Feedback 360° anonyme
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Vos retours sont confidentiels. Seule la note et les commentaires agrégés seront visibles par le manager.
                L&apos;employé évalué ne verra jamais les feedbacks individuels.
              </p>
            </div>
          </div>
        </div>

        {/* Request Feedback Button Header */}
        <div className="flex justify-end">
          <button
            onClick={handleOpenRequest}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 shadow-sm"
          >
            <span className="text-xl">📢</span> Demander un avis
          </button>
        </div>

        {/* Request Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 rounded-t-xl sticky top-0 z-10">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Demander du feedback</h3>
                <button onClick={() => setShowRequestModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">✕</button>
              </div>

              <div className="p-6 overflow-y-auto">
                {myReviews.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p>Aucune évaluation active en cours.</p>
                    <p className="text-sm mt-1">Vous devez avoir une évaluation ouverte (Auto-évaluation ou Manager) pour demander du feedback.</p>
                  </div>
                ) : (
                  <form id="requestForm" onSubmit={handleSendRequest} className="space-y-6">
                    {/* Review Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contexte (Évaluation)</label>
                      <select
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={requestData.review_id}
                        onChange={e => setRequestData({ ...requestData, review_id: Number(e.target.value) })}
                      >
                        {myReviews.map(r => (
                          <option key={r.id} value={r.id}>{r.campaign?.title} ({r.campaign?.year})</option>
                        ))}
                      </select>
                    </div>

                    {/* Reviewers Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Choisir les évaluateurs ({requestData.reviewer_ids.length})</label>

                      <input
                        type="text"
                        placeholder="Rechercher..."
                        className="w-full mb-2 px-3 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />

                      <div className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto">
                        {employees
                          .filter(e => e.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
                          .map(emp => (
                            <div
                              key={emp.id}
                              className={`flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${requestData.reviewer_ids.includes(emp.id) ? 'bg-primary/5' : ''}`}
                              onClick={() => toggleReviewer(emp.id)}
                            >
                              <input
                                type="checkbox"
                                checked={requestData.reviewer_ids.includes(emp.id)}
                                readOnly
                                className="mr-3 rounded text-primary focus:ring-primary"
                              />
                              <div>
                                <div className="font-medium text-sm text-gray-900 dark:text-white">{emp.full_name}</div>
                                <div className="text-xs text-gray-500">{emp.job_title || emp.position?.title}</div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Options */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="anon"
                        checked={requestData.is_anonymous}
                        onChange={e => setRequestData({ ...requestData, is_anonymous: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="anon" className="text-sm text-gray-600 dark:text-gray-300">
                        Demander des réponses anonymes (Recommandé)
                      </label>
                    </div>
                  </form>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-xl flex justify-end gap-3 sticky bottom-0 z-10">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-white dark:hover:bg-gray-700"
                >
                  Fermer
                </button>
                {myReviews.length > 0 && (
                  <button
                    type="submit"
                    form="requestForm"
                    disabled={requesting}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    {requesting ? "Envoi..." : "Envoyer la demande"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pending Feedback */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📬 Demandes de feedback en attente ({pendingFeedback.length})
          </h2>

          {pendingFeedback.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="text-5xl mb-4">✨</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Aucune demande en attente
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Vous n&apos;avez pas de feedback à donner pour le moment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingFeedback.map((feedback) => (
                <div
                  key={feedback.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-semibold">
                          {feedback.review?.employee?.full_name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {feedback.review?.employee?.full_name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {feedback.review?.employee?.position?.title} • {feedback.review?.employee?.department?.department_name}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Campagne: {feedback.review?.campaign?.title} ({feedback.review?.campaign?.year})
                          </p>
                        </div>
                      </div>

                      {showFeedbackForm !== feedback.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setShowFeedbackForm(feedback.id);
                              setFeedbackData({ rating: 4, comments: "" });
                            }}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            Donner mon feedback
                          </button>
                          <button
                            onClick={() => handleDecline(feedback.id)}
                            disabled={submittingId === feedback.id}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                          >
                            Décliner
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Feedback Form */}
                  {showFeedbackForm === feedback.id && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-900/50">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                        Votre évaluation de {feedback.review?.employee?.full_name}
                      </h4>

                      {/* Rating */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Note globale
                        </label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                              className="focus:outline-none"
                            >
                              <svg
                                className={`w-8 h-8 transition-colors ${star <= feedbackData.rating
                                  ? "text-yellow-400"
                                  : "text-gray-300 dark:text-gray-600"
                                  }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </button>
                          ))}
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                            {feedbackData.rating}/5
                          </span>
                        </div>
                      </div>

                      {/* Comments */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Commentaires (anonymes) *
                        </label>
                        <textarea
                          value={feedbackData.comments}
                          onChange={(e) => setFeedbackData({ ...feedbackData, comments: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary"
                          placeholder="Partagez vos observations sur les compétences, le travail d'équipe, la communication..."
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Vos commentaires seront agrégés avec ceux des autres évaluateurs.
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleSubmitFeedback(feedback.id)}
                          disabled={submittingId === feedback.id}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                        >
                          {submittingId === feedback.id ? "Envoi..." : "Envoyer le feedback"}
                        </button>
                        <button
                          onClick={() => setShowFeedbackForm(null)}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            💡 Conseils pour un feedback constructif
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Soyez spécifique avec des exemples concrets</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Équilibrez points forts et axes d&apos;amélioration</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Focalisez-vous sur les comportements observables</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Proposez des suggestions d&apos;amélioration</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-500">✗</span>
              <span>Évitez les jugements personnels</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-500">✗</span>
              <span>Ne comparez pas avec d&apos;autres collègues</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
