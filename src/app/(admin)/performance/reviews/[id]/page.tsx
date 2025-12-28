"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PerformanceService, { Review, Objective } from "@/services/performance.service";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const REVIEW_STATUS_LABELS: Record<string, string> = {
    PENDING_SELF: "En attente auto-évaluation",
    PENDING_MANAGER: "En attente validation manager",
    PENDING_FEEDBACK: "En attente feedback",
    PENDING_FINAL: "En attente finalisation",
    COMPLETED: "Terminée",
    CANCELLED: "Annulée",
};

const REVIEW_STATUS_COLORS: Record<string, string> = {
    PENDING_SELF: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    PENDING_MANAGER: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    PENDING_FEEDBACK: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    PENDING_FINAL: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

export default function ReviewDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const toast = useToast();
    const { user } = useAuth();

    const [review, setReview] = useState<Review | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Objective Form State
    const [showAddObjective, setShowAddObjective] = useState(false);
    const [newObj, setNewObj] = useState({
        title: "",
        description: "",
        weight: 20,
        metric_type: "PERCENTAGE" as const,
        type: "INDIVIDUAL" as "INDIVIDUAL" | "TEAM" | "COMPANY"
    });

    // Review Form states
    const [selfRating, setSelfRating] = useState(0);
    const [selfComments, setSelfComments] = useState("");
    const [managerRating, setManagerRating] = useState(0);
    const [managerComments, setManagerComments] = useState("");

    const [companyObjs, setCompanyObjs] = useState<Objective[]>([]);
    const [teamObjs, setTeamObjs] = useState<Objective[]>([]);

    useEffect(() => {
        if (id) loadReview(Number(id));
    }, [id]);

    useEffect(() => {
        if (review) loadContextObjectives();
    }, [review]);

    const loadReview = async (reviewId: number) => {
        try {
            setLoading(true);
            const res = await PerformanceService.getReview(reviewId);
            if (res.success) {
                setReview(res.data);
                // Init form data
                if (res.data.self_rating) setSelfRating(res.data.self_rating);
                if (res.data.self_comments) setSelfComments(res.data.self_comments);
                if (res.data.manager_rating) setManagerRating(res.data.manager_rating);
                if (res.data.manager_comments) setManagerComments(res.data.manager_comments);
            } else {
                toast.error("Impossible de charger l'évaluation");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors du chargement");
        } finally {
            setLoading(false);
        }
    };

    const loadContextObjectives = async () => {
        if (!review) return;
        try {
            // Fetch Company Objectives (Global)
            const resCompany = await PerformanceService.getObjectives({ type: 'COMPANY' } as any);
            if (resCompany.success) setCompanyObjs(resCompany.data);

            // Fetch Team Objectives (Owned by Manager)
            if (review.manager_id) {
                const resTeam = await PerformanceService.getObjectives({
                    type: 'TEAM',
                    employee_id: review.manager_id
                } as any);
                if (resTeam.success) setTeamObjs(resTeam.data);
            }
        } catch (error) {
            console.error("Error loading context objectives", error);
        }
    };

    const handleAddObjective = async () => {
        if (!review || !newObj.title) {
            toast.error("Titre requis");
            return;
        }
        try {
            setSubmitting(true);
            await PerformanceService.createObjective({
                ...newObj,
                review_id: review.id,
                employee_id: review.employee_id,
                type: newObj.type, // Use selected type
                metric_type: newObj.metric_type as any, // Cast to avoid strict type issues
                target_value: 100, // Default target
                start_date: new Date().toISOString(),
                due_date: review.campaign?.end_date || new Date().toISOString(),
                status: 'NOT_STARTED'
            });
            toast.success("Objectif ajouté");
            setShowAddObjective(false);
            setNewObj({
                title: "",
                description: "",
                weight: 20,
                metric_type: "PERCENTAGE",
                type: "INDIVIDUAL"
            });
            loadReview(review.id); // Reload to show new objective
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la création de l'objectif");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitSelf = async () => {
        if (!review) return;
        try {
            setSubmitting(true);
            await PerformanceService.submitSelfReview(review.id, {
                self_rating: selfRating,
                self_comments: selfComments,
            });
            toast.success("Auto-évaluation soumise");
            loadReview(review.id);
        } catch (error) {
            toast.error("Erreur lors de la soumission");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitManager = async () => {
        if (!review) return;
        try {
            setSubmitting(true);
            await PerformanceService.submitManagerReview(review.id, {
                manager_rating: managerRating,
                manager_comments: managerComments,
            });
            toast.success("Évaluation manager soumise");
            loadReview(review.id);
        } catch (error) {
            toast.error("Erreur lors de la soumission");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!review) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Évaluation introuvable</h2>
                <Link href="/performance/reviews" className="text-primary hover:underline mt-4 inline-block">
                    Retour à la liste
                </Link>
            </div>
        );
    }

    const isEmployee = user?.id === review.employee_id;
    const isManager = user?.id === review.manager_id;
    const isAdmin = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_RH' || user?.role === 'ROLE_SUPER_ADMIN';

    const canEditSelf = (isEmployee && review.status === "PENDING_SELF") || isAdmin;
    const canEditManager = (isManager && review.status === "PENDING_MANAGER") || isAdmin;

    // Admin can always add objectives if not completed
    const canAddObjective = canEditSelf || canEditManager || (isAdmin && review.status !== 'COMPLETED' && review.status !== 'CANCELLED');

    return (
        <div>
            <PageBreadcrumb pageTitle={`Évaluation : ${review.campaign?.title || '#' + review.id}`} />

            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {review.employee?.full_name || "Employé"}
                            </h1>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${REVIEW_STATUS_COLORS[review.status]}`}>
                                {REVIEW_STATUS_LABELS[review.status]}
                            </span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Campagne : {review.campaign?.title} ({review.campaign?.year})
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Manager : {review.manager?.full_name || "N/A"}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Objectives */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Strategic Context */}
                    {(companyObjs.length > 0 || teamObjs.length > 0) && (
                        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-6 border border-blue-100 dark:border-blue-900/30">
                            <h2 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">Alignement Stratégique</h2>

                            {companyObjs.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-xs font-bold uppercase text-blue-800 dark:text-blue-300 mb-2">Objectifs Entreprise</h3>
                                    <div className="space-y-2">
                                        {companyObjs.map(obj => (
                                            <div key={obj.id} className="p-2 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-800 text-sm">
                                                <div className="font-medium text-gray-900 dark:text-gray-100">{obj.title}</div>
                                                {obj.description && <div className="text-xs text-gray-500 mt-1 line-clamp-2">{obj.description}</div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {teamObjs.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold uppercase text-blue-800 dark:text-blue-300 mb-2">Objectifs d'Équipe</h3>
                                    <div className="space-y-2">
                                        {teamObjs.map(obj => (
                                            <div key={obj.id} className="p-2 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-800 text-sm">
                                                <div className="font-medium text-gray-900 dark:text-gray-100">{obj.title}</div>
                                                {obj.description && <div className="text-xs text-gray-500 mt-1 line-clamp-2">{obj.description}</div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Objectifs</h2>
                            {canAddObjective && (
                                <button
                                    onClick={() => setShowAddObjective(!showAddObjective)}
                                    className="text-sm text-primary hover:text-primary/80 font-medium bg-primary/10 px-2 py-1 rounded"
                                >
                                    + Ajouter
                                </button>
                            )}
                        </div>

                        {showAddObjective && (
                            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h3 className="text-sm font-medium mb-3 text-gray-900 dark:text-white">Nouvel objectif</h3>
                                <div className="space-y-3">
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Titre de l'objectif"
                                            className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                            value={newObj.title}
                                            onChange={e => setNewObj({ ...newObj, title: e.target.value })}
                                        />
                                    </div>
                                    {isAdmin && (
                                        <div>
                                            <select
                                                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                                value={newObj.type}
                                                onChange={e => setNewObj({ ...newObj, type: e.target.value as any })}
                                            >
                                                <option value="INDIVIDUAL">Individuel</option>
                                                <option value="TEAM">Équipe</option>
                                                <option value="COMPANY">Entreprise</option>
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <textarea
                                            placeholder="Description"
                                            rows={2}
                                            className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                            value={newObj.description}
                                            onChange={e => setNewObj({ ...newObj, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                placeholder="Poids"
                                                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                                value={newObj.weight}
                                                onChange={e => setNewObj({ ...newObj, weight: Number(e.target.value) })}
                                            />
                                            <span className="text-xs text-gray-500">%</span>
                                        </div>
                                        <select
                                            className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                            value={newObj.metric_type}
                                            onChange={e => setNewObj({ ...newObj, metric_type: e.target.value as any })}
                                        >
                                            <option value="PERCENTAGE">Pourcentage</option>
                                            <option value="NUMBER">Nombre</option>
                                            <option value="CURRENCY">Devise</option>
                                            <option value="BOOLEAN">Oui/Non</option>
                                        </select>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            onClick={() => setShowAddObjective(false)}
                                            className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={handleAddObjective}
                                            disabled={submitting}
                                            className="px-3 py-1.5 text-xs bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                                        >
                                            Créer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(!review.objectives || review.objectives.length === 0) ? (
                            <p className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                Aucun objectif assigné. <br />
                                {canAddObjective && "Cliquez sur 'Ajouter' pour en créer un."}
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {review.objectives.map(obj => (
                                    <div key={obj.id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                        <div className="font-medium text-gray-900 dark:text-white">{obj.title}</div>
                                        <div className="text-xs text-gray-500 mt-1 mb-2">{obj.description}</div>
                                        {/* Simple progress bar */}
                                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                            <div className="bg-primary h-2 rounded-full" style={{ width: `${obj.current_value || 0}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Link href="/performance/objectives" className="text-sm text-primary hover:underline flex items-center gap-1">
                                Gérer mes objectifs détaillés &rarr;
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right Column: Assessment Forms */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Auto-Evaluation Section */}
                    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${canEditSelf ? 'ring-2 ring-primary/20' : 'opacity-80'}`}>
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">1. Auto-évaluation</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note globale (0-100)</label>
                                <input
                                    type="range"
                                    min="0" max="100"
                                    value={selfRating}
                                    onChange={(e) => setSelfRating(Number(e.target.value))}
                                    disabled={!canEditSelf}
                                    className="w-full"
                                />
                                <div className="text-right font-bold text-primary">{selfRating}/100</div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commentaires</label>
                                <textarea
                                    rows={4}
                                    value={selfComments}
                                    onChange={(e) => setSelfComments(e.target.value)}
                                    disabled={!canEditSelf}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                                    placeholder="Vos réalisations, points forts, axes d'amélioration..."
                                />
                            </div>

                            {canEditSelf && (
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleSubmitSelf}
                                        disabled={submitting}
                                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        {submitting ? "Envoi..." : "Soumettre mon auto-évaluation"}
                                    </button>
                                </div>
                            )}
                            {!canEditSelf && review.self_submitted_at && (
                                <div className="text-xs text-green-600 dark:text-green-400 text-right">
                                    Soumise le {new Date(review.self_submitted_at).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Manager Evaluation Section */}
                    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${(canEditManager) ? 'ring-2 ring-blue-500/20' : ''}`}>
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">2. Évaluation Manager</h2>

                        {review.status === "PENDING_SELF" ? (
                            <div className="text-center py-6 text-gray-500 italic">
                                En attente de l&apos;auto-évaluation de l&apos;employé.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note Manager (0-100)</label>
                                    <input
                                        type="range"
                                        min="0" max="100"
                                        value={managerRating}
                                        onChange={(e) => setManagerRating(Number(e.target.value))}
                                        disabled={!canEditManager}
                                        className="w-full"
                                    />
                                    <div className="text-right font-bold text-blue-600">{managerRating}/100</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commentaires Manager</label>
                                    <textarea
                                        rows={4}
                                        value={managerComments}
                                        onChange={(e) => setManagerComments(e.target.value)}
                                        disabled={!canEditManager}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                                        placeholder="Feedback managérial..."
                                    />
                                </div>

                                {canEditManager && (
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSubmitManager}
                                            disabled={submitting}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {submitting ? "Envoi..." : "Soumettre l'évaluation"}
                                        </button>
                                    </div>
                                )}
                                {!canEditManager && review.manager_submitted_at && (
                                    <div className="text-xs text-green-600 dark:text-green-400 text-right">
                                        Soumise le {new Date(review.manager_submitted_at).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
