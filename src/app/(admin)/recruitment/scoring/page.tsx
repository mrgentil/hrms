"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { recruitmentService, JobOffer, RankedCandidate } from "@/services/recruitment.service";

export default function ScoringPage() {
    const [jobs, setJobs] = useState<JobOffer[]>([]);
    const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
    const [ranking, setRanking] = useState<RankedCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [scoring, setScoring] = useState(false);
    const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
    const [showCompare, setShowCompare] = useState(false);

    useEffect(() => {
        loadJobs();
    }, []);

    const loadJobs = async () => {
        try {
            const data = await recruitmentService.getJobOffers();
            setJobs(data.filter(j => j.status === "PUBLISHED"));
        } catch (error) {
            console.error("Failed to load jobs", error);
        } finally {
            setLoading(false);
        }
    };

    const loadRanking = async (jobId: number) => {
        try {
            setLoading(true);
            const data = await recruitmentService.getCandidateRanking(jobId);
            setRanking(data);
        } catch (error) {
            console.error("Failed to load ranking", error);
            setRanking([]);
        } finally {
            setLoading(false);
        }
    };

    const handleJobSelect = (jobId: number) => {
        setSelectedJobId(jobId);
        loadRanking(jobId);
    };

    const handleScoreAll = async () => {
        if (!selectedJobId) return;
        setScoring(true);
        try {
            await recruitmentService.scoreAllCandidates(selectedJobId);
            await loadRanking(selectedJobId);
        } catch (error) {
            console.error("Failed to score candidates", error);
            alert("Erreur lors du calcul des scores");
        } finally {
            setScoring(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 75) return "text-green-600 bg-green-100";
        if (score >= 50) return "text-yellow-600 bg-yellow-100";
        return "text-red-600 bg-red-100";
    };

    const getScoreLevel = (score: number) => {
        if (score >= 75) return "Excellent";
        if (score >= 50) return "Bon";
        if (score >= 25) return "Moyen";
        return "Faible";
    };

    const getRankBadge = (rank: number) => {
        if (rank === 1) return "🥇";
        if (rank === 2) return "🥈";
        if (rank === 3) return "🥉";
        return `#${rank}`;
    };

    const exportToCSV = () => {
        if (ranking.length === 0) return;

        const headers = ["Rang", "Nom", "Email", "Score", "Compétences", "Expérience", "Entretiens", "Rating", "Étape"];
        const rows = ranking.map(c => [
            c.rank,
            c.candidateName,
            c.email,
            c.score,
            c.breakdown.skills,
            c.breakdown.experience,
            c.breakdown.interview,
            c.breakdown.rating,
            c.stage,
        ]);

        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `classement_candidats_${selectedJobId}_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const toggleCompareSelect = (candidateId: number) => {
        setSelectedForCompare(prev => {
            if (prev.includes(candidateId)) {
                return prev.filter(id => id !== candidateId);
            }
            if (prev.length >= 3) return prev;
            return [...prev, candidateId];
        });
    };

    const compareData = ranking.filter(c => selectedForCompare.includes(c.candidateId));

    if (loading && jobs.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="h-full">
            <PageBreadcrumb pageTitle="Scoring des Candidatures" />

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Classement des Candidats
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Évaluez et comparez les candidats pour chaque offre d'emploi
                        </p>
                    </div>
                    <div className="flex gap-3 items-center w-full md:w-auto">
                        <select
                            value={selectedJobId || ""}
                            onChange={(e) => handleJobSelect(parseInt(e.target.value))}
                            className="flex-1 md:flex-none md:min-w-[300px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">-- Sélectionner une offre --</option>
                            {jobs.map((job) => (
                                <option key={job.id} value={job.id}>
                                    {job.title} ({job.department})
                                </option>
                            ))}
                        </select>
                        {selectedJobId && (
                            <>
                                <button
                                    onClick={handleScoreAll}
                                    disabled={scoring}
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap"
                                >
                                    {scoring ? "Calcul..." : "🔄 Recalculer"}
                                </button>
                                {ranking.length > 0 && (
                                    <>
                                        <button
                                            onClick={exportToCSV}
                                            className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap"
                                        >
                                            📥 Exporter CSV
                                        </button>
                                        <button
                                            onClick={() => setShowCompare(!showCompare)}
                                            className={`px-4 py-2 border rounded-lg whitespace-nowrap ${showCompare ? 'bg-purple-100 border-purple-300 text-purple-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                        >
                                            ⚖️ Comparer
                                        </button>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {!selectedJobId ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Sélectionnez une offre d'emploi
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Choisissez une offre pour voir le classement des candidats
                    </p>
                </div>
            ) : loading ? (
                <div className="flex items-center justify-center min-h-[300px]">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
            ) : ranking.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Aucun candidat
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Aucune candidature pour cette offre d'emploi
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Rang
                                    </th>
                                    {showCompare && (
                                        <th className="px-3 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Select
                                        </th>
                                    )}
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Candidat
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Score Global
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Compétences
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Expérience
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Entretiens
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Rating
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Étape
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {ranking.map((candidate) => (
                                    <tr key={candidate.applicationId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-2xl">{getRankBadge(candidate.rank)}</span>
                                        </td>
                                        {showCompare && (
                                            <td className="px-3 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedForCompare.includes(candidate.candidateId)}
                                                    onChange={() => toggleCompareSelect(candidate.candidateId)}
                                                    className="w-4 h-4 text-primary rounded border-gray-300"
                                                />
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            <Link href={`/recruitment/candidates/${candidate.candidateId}`} className="flex items-center gap-3 group">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {candidate.candidateName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                                        {candidate.candidateName}
                                                    </p>
                                                    <p className="text-sm text-gray-500">{candidate.email}</p>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className={`text-2xl font-bold ${getScoreColor(candidate.score)} px-3 py-1 rounded-lg`}>
                                                    {candidate.score}
                                                </span>
                                                <span className="text-xs text-gray-500 mt-1">
                                                    {getScoreLevel(candidate.score)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <ScoreBar value={candidate.breakdown.skills} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <ScoreBar value={candidate.breakdown.experience} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <ScoreBar value={candidate.breakdown.interview} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <ScoreBar value={candidate.breakdown.rating} />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full">
                                                {candidate.stage}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Panneau de Comparaison */}
            {showCompare && compareData.length > 0 && (
                <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-purple-200 dark:border-purple-700 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            ⚖️ Comparaison ({compareData.length}/3 candidats)
                        </h3>
                        <button
                            onClick={() => setSelectedForCompare([])}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Effacer la sélection
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {compareData.map((c) => (
                            <div key={c.candidateId} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                        {c.candidateName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{c.candidateName}</p>
                                        <p className="text-sm text-gray-500">{getRankBadge(c.rank)}</p>
                                    </div>
                                </div>
                                <div className="text-center mb-4">
                                    <span className={`text-3xl font-bold ${getScoreColor(c.score)} px-4 py-2 rounded-lg`}>
                                        {c.score}/100
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>💡 Compétences</span>
                                            <span className="font-medium">{c.breakdown.skills}</span>
                                        </div>
                                        <ScoreBar value={c.breakdown.skills} />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>📅 Expérience</span>
                                            <span className="font-medium">{c.breakdown.experience}</span>
                                        </div>
                                        <ScoreBar value={c.breakdown.experience} />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>🎤 Entretiens</span>
                                            <span className="font-medium">{c.breakdown.interview}</span>
                                        </div>
                                        <ScoreBar value={c.breakdown.interview} />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>⭐ Rating</span>
                                            <span className="font-medium">{c.breakdown.rating}</span>
                                        </div>
                                        <ScoreBar value={c.breakdown.rating} />
                                    </div>
                                </div>
                                <div className="mt-4 text-center">
                                    <Link
                                        href={`/recruitment/candidates/${c.candidateId}`}
                                        className="text-primary hover:underline text-sm"
                                    >
                                        Voir profil →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Légende */}
            {ranking.length > 0 && (
                <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Légende des scores</h4>
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-green-500"></div>
                            <span className="text-gray-600 dark:text-gray-400">75-100 : Excellent</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-yellow-500"></div>
                            <span className="text-gray-600 dark:text-gray-400">50-74 : Bon</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-orange-500"></div>
                            <span className="text-gray-600 dark:text-gray-400">25-49 : Moyen</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-red-500"></div>
                            <span className="text-gray-600 dark:text-gray-400">0-24 : Faible</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Composant pour afficher une barre de progression de score
function ScoreBar({ value }: { value: number }) {
    const getBarColor = (val: number) => {
        if (val >= 75) return "bg-green-500";
        if (val >= 50) return "bg-yellow-500";
        if (val >= 25) return "bg-orange-500";
        return "bg-red-500";
    };

    return (
        <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                    className={`h-full ${getBarColor(value)} transition-all duration-300`}
                    style={{ width: `${value}%` }}
                ></div>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400 w-8">{value}</span>
        </div>
    );
}
