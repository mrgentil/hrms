"use client";

import React, { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { recruitmentService, KanbanStage, JobOffer, Candidate } from "@/services/recruitment.service";

export default function ApplicationsPage() {
    const [stages, setStages] = useState<KanbanStage[]>([]);
    const [jobs, setJobs] = useState<JobOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCandidateModal, setShowCandidateModal] = useState(false);
    const [showApplicationModal, setShowApplicationModal] = useState(false);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [saving, setSaving] = useState(false);

    const [candidateForm, setCandidateForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        skills: "",
    });

    const [applicationForm, setApplicationForm] = useState({
        jobOfferId: 0,
        candidateId: 0,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [stagesData, jobsData, candidatesData] = await Promise.all([
                recruitmentService.getApplicationsKanban(),
                recruitmentService.getJobOffers(),
                recruitmentService.getCandidates(),
            ]);
            setStages(stagesData);
            setJobs(jobsData);
            setCandidates(candidatesData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCandidate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const newCandidate = await recruitmentService.createCandidate({
                first_name: candidateForm.first_name,
                last_name: candidateForm.last_name,
                email: candidateForm.email,
                phone: candidateForm.phone,
                skills: candidateForm.skills.split(",").map(s => s.trim()).filter(Boolean),
            });
            setCandidates([...candidates, newCandidate]);
            setShowCandidateModal(false);
            setCandidateForm({ first_name: "", last_name: "", email: "", phone: "", skills: "" });
            // Open application modal with this candidate pre-selected
            setApplicationForm({ ...applicationForm, candidateId: newCandidate.id });
            setShowApplicationModal(true);
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la création du candidat");
        } finally {
            setSaving(false);
        }
    };

    const handleCreateApplication = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!applicationForm.jobOfferId || !applicationForm.candidateId) {
            alert("Veuillez sélectionner une offre et un candidat");
            return;
        }
        setSaving(true);
        try {
            await recruitmentService.createApplication(applicationForm.jobOfferId, applicationForm.candidateId);
            setShowApplicationModal(false);
            setApplicationForm({ jobOfferId: 0, candidateId: 0 });
            loadData();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la création de la candidature");
        } finally {
            setSaving(false);
        }
    };

    const handleStageChange = async (applicationId: number, newStage: string) => {
        try {
            await recruitmentService.updateApplicationStage(applicationId, newStage);
            loadData();
        } catch (error) {
            console.error("Failed to update stage", error);
        }
    };

    const getStageColor = (stageId: string) => {
        const colors: Record<string, string> = {
            NEW: "bg-blue-500",
            SCREENING: "bg-yellow-500",
            INTERVIEW: "bg-purple-500",
            OFFER: "bg-orange-500",
            HIRED: "bg-green-500",
            REJECTED: "bg-red-500",
        };
        return colors[stageId] || "bg-gray-500";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <PageBreadcrumb pageTitle="Candidatures" />

            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Pipeline de recrutement
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Gérez vos candidatures et déplacez-les entre les étapes.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCandidateModal(true)}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                    >
                        + Nouveau candidat
                    </button>
                    <button
                        onClick={() => setShowApplicationModal(true)}
                        className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90"
                    >
                        + Nouvelle candidature
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-max">
                    {stages.map((stage) => (
                        <div key={stage.id} className="w-72 flex-shrink-0">
                            <div className={`h-1 ${getStageColor(stage.id)} rounded-t-lg`}></div>
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-b-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{stage.name}</h3>
                                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                                        {stage.applications.length}
                                    </span>
                                </div>

                                <div className="space-y-3 min-h-[200px]">
                                    {stage.applications.map((app) => (
                                        <div
                                            key={app.id}
                                            className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {app.candidate?.first_name?.charAt(0) || "?"}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                        {app.candidate?.first_name} {app.candidate?.last_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{app.job_offer?.title}</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-end mt-2">
                                                <select
                                                    value={app.stage}
                                                    onChange={(e) => handleStageChange(app.id, e.target.value)}
                                                    className="text-xs px-2 py-1 border rounded dark:bg-gray-600 dark:border-gray-500"
                                                >
                                                    {stages.map((s) => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                    {stage.applications.length === 0 && (
                                        <div className="text-center text-gray-400 text-sm py-8">
                                            Aucune candidature
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal Nouveau Candidat */}
            {showCandidateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                            Nouveau Candidat
                        </h2>
                        <form onSubmit={handleCreateCandidate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Prénom *</label>
                                    <input
                                        type="text"
                                        required
                                        value={candidateForm.first_name}
                                        onChange={(e) => setCandidateForm({ ...candidateForm, first_name: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nom *</label>
                                    <input
                                        type="text"
                                        required
                                        value={candidateForm.last_name}
                                        onChange={(e) => setCandidateForm({ ...candidateForm, last_name: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={candidateForm.email}
                                    onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Téléphone</label>
                                <input
                                    type="tel"
                                    value={candidateForm.phone}
                                    onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Compétences (séparées par virgule)</label>
                                <input
                                    type="text"
                                    value={candidateForm.skills}
                                    onChange={(e) => setCandidateForm({ ...candidateForm, skills: e.target.value })}
                                    placeholder="React, Node.js, TypeScript"
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowCandidateModal(false)} className="flex-1 px-4 py-2 border rounded-lg">
                                    Annuler
                                </button>
                                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">
                                    {saving ? "..." : "Créer & Postuler"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Nouvelle Candidature */}
            {showApplicationModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                            Nouvelle Candidature
                        </h2>
                        <form onSubmit={handleCreateApplication} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Offre d'emploi *</label>
                                <select
                                    required
                                    value={applicationForm.jobOfferId}
                                    onChange={(e) => setApplicationForm({ ...applicationForm, jobOfferId: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value={0}>-- Sélectionner une offre --</option>
                                    {jobs.map((job) => (
                                        <option key={job.id} value={job.id}>{job.title} ({job.department})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Candidat *</label>
                                <select
                                    required
                                    value={applicationForm.candidateId}
                                    onChange={(e) => setApplicationForm({ ...applicationForm, candidateId: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value={0}>-- Sélectionner un candidat --</option>
                                    {candidates.map((c) => (
                                        <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.email})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowApplicationModal(false)} className="flex-1 px-4 py-2 border rounded-lg">
                                    Annuler
                                </button>
                                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">
                                    {saving ? "..." : "Créer la candidature"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
