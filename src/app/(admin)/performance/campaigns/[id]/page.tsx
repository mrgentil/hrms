"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
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

export default function CampaignDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const toast = useToast();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadCampaign(Number(id));
        }
    }, [id]);

    const loadCampaign = async (campaignId: number) => {
        try {
            setLoading(true);
            const res = await PerformanceService.getCampaign(campaignId);
            if (res.success) {
                setCampaign(res.data);
            } else {
                toast.error("Impossible de charger la campagne");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors du chargement");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!campaign) return;
        if (!confirm("Voulez-vous vraiment supprimer cette campagne ?\n\nATTENTION : Cette action est irréversible et supprimera toutes les évaluations associées.")) return;

        try {
            await PerformanceService.deleteCampaign(campaign.id);
            toast.success("Campagne supprimée avec succès");
            router.push("/performance/campaigns");
        } catch (error) {
            toast.error("Erreur lors de la suppression");
            console.error(error);
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

    if (!campaign) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Campagne introuvable</h2>
                <Link href="/performance/campaigns" className="text-primary hover:underline mt-4 inline-block">
                    Retour à la liste
                </Link>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <Link href="/performance/campaigns" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 mb-2">
                    ← Retour aux campagnes
                </Link>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        {campaign.title}
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[campaign.status]}`}>
                            {STATUS_LABELS[campaign.status]}
                        </span>
                    </h1>

                    <button
                        onClick={handleDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Supprimer la campagne
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Détails de la campagne</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    <div>
                        <dl className="space-y-4">
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Période</dt>
                                <dd className="mt-1 text-base text-gray-900 dark:text-white">
                                    {formatDate(campaign.start_date)} au {formatDate(campaign.end_date)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</dt>
                                <dd className="mt-1 text-base text-gray-900 dark:text-white capitalize">
                                    {campaign.type.replace('_', ' ').toLowerCase()}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Année fiscale</dt>
                                <dd className="mt-1 text-base text-gray-900 dark:text-white">{campaign.year}</dd>
                            </div>
                        </dl>
                    </div>
                    <div>
                        <dl className="space-y-4">
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Échéance Auto-évaluation</dt>
                                <dd className="mt-1 text-base text-gray-900 dark:text-white">
                                    {formatDate(campaign.self_review_deadline) || 'Non définie'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Échéance Manager</dt>
                                <dd className="mt-1 text-base text-gray-900 dark:text-white">
                                    {formatDate(campaign.manager_review_deadline) || 'Non définie'}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                <hr className="my-6 border-gray-200 dark:border-gray-700" />

                <h3 className="text-md font-semibold mb-3 text-gray-900 dark:text-white">Pondération des scores</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.weight_self}%</div>
                        <div className="text-xs text-gray-500">Auto-évaluation</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.weight_manager}%</div>
                        <div className="text-xs text-gray-500">Manager</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.weight_feedback360}%</div>
                        <div className="text-xs text-gray-500">Feedback 360°</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
