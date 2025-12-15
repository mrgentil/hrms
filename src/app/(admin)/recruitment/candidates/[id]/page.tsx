"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { recruitmentService, Candidate, CandidateApplication, ScoreBreakdown } from "@/services/recruitment.service";

interface CandidateDetail extends Candidate {
    applications?: (CandidateApplication & {
        job_offer?: { id: number; title: string; department: string };
        score?: number;
        score_breakdown?: ScoreBreakdown;
    })[];
    interviews?: {
        id: number;
        scheduled_at: string;
        interview_type: string;
        status: string;
        rating?: number;
        feedback?: string;
    }[];
}

export default function CandidateDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
    const [loading, setLoading] = useState(true);

    const candidateId = parseInt(params.id as string);

    useEffect(() => {
        loadCandidate();
    }, [candidateId]);

    const loadCandidate = async () => {
        try {
            const data = await recruitmentService.getCandidate(candidateId);
            setCandidate(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-600 bg-green-100";
        if (score >= 60) return "text-blue-600 bg-blue-100";
        if (score >= 40) return "text-yellow-600 bg-yellow-100";
        return "text-red-600 bg-red-100";
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            SCHEDULED: "bg-blue-100 text-blue-700",
            COMPLETED: "bg-green-100 text-green-700",
            CANCELLED: "bg-red-100 text-red-700",
        };
        return colors[status] || "bg-gray-100 text-gray-700";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!candidate) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Candidat non trouvé</p>
                <button onClick={() => router.back()} className="mt-4 text-primary hover:underline">
                    ← Retour
                </button>
            </div>
        );
    }

    return (
        <div>
            <PageBreadcrumb pageTitle={`${candidate.first_name} ${candidate.last_name}`} />

            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                            {candidate.first_name[0]}{candidate.last_name[0]}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {candidate.first_name} {candidate.last_name}
                            </h1>
                            <p className="text-gray-500 flex items-center gap-2">
                                📧 {candidate.email}
                            </p>
                            {candidate.phone && (
                                <p className="text-gray-500 flex items-center gap-2">
                                    📱 {candidate.phone}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {candidate.cv_url && (
                            <a
                                href={`${process.env.NEXT_PUBLIC_API_URL}${candidate.cv_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
                            >
                                📄 Télécharger CV
                            </a>
                        )}
                        {candidate.linkedin_url && (
                            <a
                                href={candidate.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                                🔗 LinkedIn
                            </a>
                        )}
                    </div>
                </div>

                {/* Stats rapides */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {candidate.years_experience || 0}
                        </p>
                        <p className="text-sm text-gray-500">Années d'expérience</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {candidate.applications?.length || 0}
                        </p>
                        <p className="text-sm text-gray-500">Candidatures</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {candidate.interviews?.length || 0}
                        </p>
                        <p className="text-sm text-gray-500">Entretiens</p>
                    </div>
                    <div className="text-center">
                        <div className="flex justify-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className={`text-xl ${star <= (candidate.rating || 0) ? "text-yellow-400" : "text-gray-300"}`}>
                                    ★
                                </span>
                            ))}
                        </div>
                        <p className="text-sm text-gray-500">Rating</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Compétences */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            💡 Compétences
                        </h2>
                        {candidate.skills && Array.isArray(candidate.skills) && candidate.skills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {(candidate.skills as string[]).map((skill, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">Aucune compétence renseignée</p>
                        )}

                        {candidate.is_in_talent_pool && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-1 w-fit">
                                    ⭐ Dans le Talent Pool
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Candidatures */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            📋 Candidatures
                        </h2>
                        {candidate.applications && candidate.applications.length > 0 ? (
                            <div className="space-y-4">
                                {candidate.applications.map((app) => (
                                    <div
                                        key={app.id}
                                        className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-between"
                                    >
                                        <div>
                                            <h3 className="font-medium text-gray-900 dark:text-white">
                                                {app.job_offer?.title || "Offre inconnue"}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {app.job_offer?.department} • Étape: {app.stage}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {app.score !== undefined && app.score !== null && (
                                                <span className={`px-3 py-1 rounded-full font-semibold ${getScoreColor(app.score)}`}>
                                                    {app.score}/100
                                                </span>
                                            )}
                                            <Link
                                                href="/recruitment/applications"
                                                className="text-primary hover:underline text-sm"
                                            >
                                                Voir →
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">Aucune candidature</p>
                        )}
                    </div>

                    {/* Score Breakdown */}
                    {candidate.applications?.[0]?.score_breakdown && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mt-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                📊 Détail du Score
                            </h2>
                            <div className="space-y-4">
                                {Object.entries(candidate.applications[0].score_breakdown).map(([key, value]) => (
                                    <div key={key}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="capitalize text-gray-600 dark:text-gray-400">
                                                {key === 'skills' ? '💡 Compétences' :
                                                    key === 'experience' ? '📅 Expérience' :
                                                        key === 'interview' ? '🎤 Entretiens' :
                                                            key === 'rating' ? '⭐ Rating' : key}
                                            </span>
                                            <span className="font-medium">{value}/100</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full transition-all"
                                                style={{ width: `${value}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Entretiens */}
                    {candidate.interviews && candidate.interviews.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mt-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                🎤 Historique des Entretiens
                            </h2>
                            <div className="space-y-3">
                                {candidate.interviews.map((interview) => (
                                    <div
                                        key={interview.id}
                                        className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {interview.interview_type}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(interview.scheduled_at).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {interview.rating && (
                                                <span className="text-yellow-500">
                                                    {"★".repeat(interview.rating)}
                                                </span>
                                            )}
                                            <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(interview.status)}`}>
                                                {interview.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
