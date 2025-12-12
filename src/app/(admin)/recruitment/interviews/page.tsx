"use client";

import React, { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Interview, CandidateApplication, recruitmentService } from "@/services/recruitment.service";

interface User {
    id: number;
    full_name: string;
}

export default function InterviewsPage() {
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [applications, setApplications] = useState<CandidateApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        applicationId: 0,
        interviewDate: "",
        interviewTime: "",
        type: "VISIO",
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [interviewsData, applicationsData] = await Promise.all([
                recruitmentService.getInterviews(),
                recruitmentService.getApplications(),
            ]);
            setInterviews(interviewsData);
            setApplications(applicationsData);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.applicationId || !formData.interviewDate) {
            alert("Veuillez remplir tous les champs obligatoires");
            return;
        }
        setSaving(true);
        try {
            const selectedApp = applications.find(a => a.id === formData.applicationId);
            const dateTime = `${formData.interviewDate}T${formData.interviewTime || "10:00"}:00`;

            await recruitmentService.createInterview({
                applicationId: formData.applicationId,
                candidateId: selectedApp?.candidate_id || 0,
                interviewerId: 1, // Default to first user - in real app would be selectable
                interviewDate: dateTime,
                type: formData.type,
            });
            setShowModal(false);
            setFormData({ applicationId: 0, interviewDate: "", interviewTime: "", type: "VISIO" });
            loadData();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la création de l'entretien");
        } finally {
            setSaving(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "SCHEDULED": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
            case "COMPLETED": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
            case "CANCELLED": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
            default: return "";
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "VISIO": return "💻";
            case "PHONE": return "📞";
            case "PRESENTIEL": return "🏢";
            default: return "📅";
        }
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
            <PageBreadcrumb pageTitle="Entretiens" />

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Planning des entretiens
                    </h2>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90"
                    >
                        + Planifier un entretien
                    </button>
                </div>

                {interviews.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <p>Aucun entretien planifié.</p>
                        <button onClick={() => setShowModal(true)} className="text-primary hover:underline mt-2">
                            Planifier un entretien
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase font-semibold text-gray-500">
                                <tr>
                                    <th className="px-6 py-4">Candidat</th>
                                    <th className="px-6 py-4">Poste</th>
                                    <th className="px-6 py-4">Date & Heure</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Recruteur</th>
                                    <th className="px-6 py-4">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {interviews.map((interview) => (
                                    <tr key={interview.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {interview.candidate?.first_name} {interview.candidate?.last_name}
                                        </td>
                                        <td className="px-6 py-4">{interview.application?.job_offer?.title || "-"}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {new Date(interview.interview_date).toLocaleDateString()}
                                                </span>
                                                <span className="text-gray-500 text-xs">
                                                    {new Date(interview.interview_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{getTypeIcon(interview.type)}</span>
                                                <span className="text-xs">{interview.type}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{interview.interviewer?.full_name || "Non assigné"}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(interview.status)}`}>
                                                {interview.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de création */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                            Planifier un entretien
                        </h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Candidature *</label>
                                <select
                                    required
                                    value={formData.applicationId}
                                    onChange={(e) => setFormData({ ...formData, applicationId: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value={0}>-- Sélectionner une candidature --</option>
                                    {applications.map((app) => (
                                        <option key={app.id} value={app.id}>
                                            {app.candidate?.first_name} {app.candidate?.last_name} - {app.job_offer?.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.interviewDate}
                                        onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Heure</label>
                                    <input
                                        type="time"
                                        value={formData.interviewTime}
                                        onChange={(e) => setFormData({ ...formData, interviewTime: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Type d'entretien</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="VISIO">💻 Visioconférence</option>
                                    <option value="PRESENTIEL">🏢 Présentiel</option>
                                    <option value="PHONE">📞 Téléphone</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg">
                                    Annuler
                                </button>
                                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">
                                    {saving ? "..." : "Planifier"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
