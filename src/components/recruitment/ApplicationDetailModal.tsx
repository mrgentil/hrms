"use client";

import React from "react";
import Link from "next/link";
import { CandidateApplication, ScoreBreakdown } from "@/services/recruitment.service";

interface ApplicationDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    application: CandidateApplication & {
        candidate?: {
            id: number;
            first_name: string;
            last_name: string;
            email: string;
            phone?: string;
            skills?: string[];
            cv_url?: string;
            years_experience?: number;
        };
        job_offer?: {
            id: number;
            title: string;
            department: string;
        };
        score?: number;
        score_breakdown?: ScoreBreakdown;
    };
    onStageChange: (applicationId: number, newStage: string) => void;
}

export default function ApplicationDetailModal({
    isOpen,
    onClose,
    application,
    onStageChange,
}: ApplicationDetailModalProps) {
    if (!isOpen || !application) return null;

    const candidate = application.candidate;
    const jobOffer = application.job_offer;
    const score = application.score ?? 0;
    const breakdown = application.score_breakdown;

    const getScoreColor = (s: number) => {
        if (s >= 80) return "text-green-600 bg-green-100";
        if (s >= 60) return "text-blue-600 bg-blue-100";
        if (s >= 40) return "text-yellow-600 bg-yellow-100";
        return "text-red-600 bg-red-100";
    };

    const stages = ["NEW", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];
    const stageLabels: Record<string, string> = {
        NEW: "Nouveau",
        SCREENING: "Présélection",
        INTERVIEW: "Entretien",
        OFFER: "Offre",
        HIRED: "Embauché",
        REJECTED: "Rejeté",
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary/10 to-transparent">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-white font-bold">
                                {candidate?.first_name?.[0]}{candidate?.last_name?.[0]}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {candidate?.first_name} {candidate?.last_name}
                                </h2>
                                <p className="text-sm text-gray-500">{candidate?.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`px-4 py-2 rounded-full text-lg font-bold ${getScoreColor(score)}`}>
                                {score}/100
                            </span>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {/* Poste */}
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Candidature pour</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                            {jobOffer?.title} - {jobOffer?.department}
                        </p>
                    </div>

                    {/* Score Breakdown */}
                    {breakdown && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">📊 Détail du Score</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {Object.entries(breakdown).map(([key, value]) => (
                                    <div key={key} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm capitalize">
                                                {key === 'skills' ? '💡 Compétences' :
                                                    key === 'experience' ? '📅 Expérience' :
                                                        key === 'interview' ? '🎤 Entretiens' : '⭐ Rating'}
                                            </span>
                                            <span className="font-bold">{value}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                            <div
                                                className={`h-1.5 rounded-full ${value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}
                                                style={{ width: `${value}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Compétences */}
                    {candidate?.skills && Array.isArray(candidate.skills) && candidate.skills.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">💡 Compétences</h3>
                            <div className="flex flex-wrap gap-2">
                                {(candidate.skills as string[]).map((skill, i) => (
                                    <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-sm rounded-full">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Infos candidat */}
                    <div className="mb-6 grid grid-cols-2 gap-4">
                        {candidate?.phone && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <span>📱</span> {candidate.phone}
                            </div>
                        )}
                        {candidate?.years_experience !== undefined && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <span>📅</span> {candidate.years_experience} ans d'expérience
                            </div>
                        )}
                    </div>

                    {/* Changer étape */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🔄 Changer l'étape</h3>
                        <div className="flex flex-wrap gap-2">
                            {stages.map(stage => (
                                <button
                                    key={stage}
                                    onClick={() => onStageChange(application.id, stage)}
                                    className={`px-3 py-1.5 rounded-full text-sm transition ${application.stage === stage
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    {stageLabels[stage]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                    {candidate?.cv_url && (
                        <a
                            href={`${process.env.NEXT_PUBLIC_API_URL}${candidate.cv_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2.5 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-center flex items-center justify-center gap-2"
                        >
                            📄 Télécharger CV
                        </a>
                    )}
                    <Link
                        href={`/recruitment/candidates/${candidate?.id}`}
                        className="flex-1 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 text-center"
                    >
                        Voir profil complet →
                    </Link>
                </div>
            </div>
        </div>
    );
}
