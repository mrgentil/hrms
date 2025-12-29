"use client";

import React, { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { recruitmentService, JobOffer } from "@/services/recruitment.service";
import Link from "next/link";
import Pagination from "@/components/common/Pagination";

export default function JobOffersPage() {
    const [jobs, setJobs] = useState<JobOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalJobs, setTotalJobs] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingJob, setEditingJob] = useState<JobOffer | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [extracting, setExtracting] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        department: "",
        location: "",
        contract_type: "CDI",
        status: "DRAFT",
        required_skills: "",
        min_experience: 0,
    });

    useEffect(() => {
        loadJobs();
    }, [currentPage]);

    const loadJobs = async () => {
        setLoading(true);
        try {
            const response = await recruitmentService.getJobOffers({ page: currentPage, limit: 9 });
            setJobs(response.data);
            setTotalPages(response.totalPages);
            setTotalJobs(response.total);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            department: "",
            location: "",
            contract_type: "CDI",
            status: "DRAFT",
            required_skills: "",
            min_experience: 0,
        });
        setEditingJob(null);
    };

    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (job: JobOffer) => {
        setEditingJob(job);
        setFormData({
            title: job.title,
            description: job.description || "",
            department: job.department,
            location: job.location,
            contract_type: job.contract_type,
            status: job.status,
            required_skills: (job.required_skills && Array.isArray(job.required_skills)) ? job.required_skills.join(", ") : "",
            min_experience: job.min_experience || 0,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setSaving(true);
        try {
            const dataToSave = {
                ...formData,
                required_skills: formData.required_skills
                    ? (formData.required_skills as string).split(",").map(s => s.trim()).filter(Boolean)
                    : [],
            };

            if (editingJob) {
                await recruitmentService.updateJobOffer(editingJob.id, dataToSave);
            } else {
                await recruitmentService.createJobOffer(dataToSave);
            }
            setShowModal(false);
            resetForm();
            loadJobs();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la sauvegarde");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (jobId: number) => {
        try {
            await recruitmentService.deleteJobOffer(jobId);
            setDeleteConfirm(null);
            loadJobs();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la suppression");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PUBLISHED": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
            case "DRAFT": return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
            case "CLOSED": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
            default: return "bg-gray-100 text-gray-700";
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
            <PageBreadcrumb pageTitle="Offres d'Emploi" />

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Offres en cours ({totalJobs})
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Gérez vos offres d'emploi et suivez les candidatures
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Créer une offre
                </button>
            </div>

            {jobs.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
                    <p className="text-gray-500 mb-4">Aucune offre d'emploi pour le moment.</p>
                    <button onClick={openCreateModal} className="text-primary hover:underline">
                        Créer votre première offre
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {jobs.map((job) => (
                            <div
                                key={job.id}
                                className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-primary/50 transition-all"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                                        {job.status === 'PUBLISHED' ? 'Publiée' : job.status === 'DRAFT' ? 'Brouillon' : 'Fermée'}
                                    </span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => openEditModal(job)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                            title="Modifier"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(job.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                            title="Supprimer"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
                                    {job.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium flex items-center gap-2">
                                    🏢 {job.department}
                                </p>

                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                                    {job.description || "Pas de description"}
                                </p>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                                        📍 {job.location}
                                    </span>
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                                        💼 {job.contract_type}
                                    </span>
                                    {job.min_experience && job.min_experience > 0 && (
                                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                                            📅 {job.min_experience}+ ans
                                        </span>
                                    )}
                                </div>

                                {job.required_skills && job.required_skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {job.required_skills.slice(0, 3).map((skill, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                                                {skill}
                                            </span>
                                        ))}
                                        {job.required_skills.length > 3 && (
                                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 text-xs rounded-full">
                                                +{job.required_skills.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                        {job.applications?.length || 0} candidats
                                    </span>
                                    <Link
                                        href="/recruitment/applications"
                                        className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                                    >
                                        Voir →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        className="mt-6"
                    />
                </>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                            {editingJob ? "Modifier l'offre" : "Créer une offre d'emploi"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Titre du poste *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-primary"
                                    placeholder="Ex: Développeur Full Stack"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Département *
                                </label>
                                <input
                                    type="text"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-primary"
                                    placeholder="Ex: R&D"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Localisation *
                                </label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-primary"
                                    placeholder="Ex: Paris, France"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Type de contrat
                                    </label>
                                    <select
                                        value={formData.contract_type}
                                        onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-primary"
                                    >
                                        <option value="CDI">CDI</option>
                                        <option value="CDD">CDD</option>
                                        <option value="Stage">Stage</option>
                                        <option value="Freelance">Freelance</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Statut
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-primary"
                                    >
                                        <option value="DRAFT">Brouillon</option>
                                        <option value="PUBLISHED">Publiée</option>
                                        <option value="CLOSED">Fermée</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-primary"
                                    rows={3}
                                    placeholder="Décrivez le poste..."
                                />
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!formData.description) return;
                                        setExtracting(true);
                                        try {
                                            const skills = await recruitmentService.extractSkills(formData.description);
                                            if (skills.length > 0) {
                                                setFormData({ ...formData, required_skills: skills.join(", ") });
                                            }
                                        } catch (error) {
                                            console.error(error);
                                        } finally {
                                            setExtracting(false);
                                        }
                                    }}
                                    disabled={extracting || !formData.description}
                                    className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                    {extracting ? "Extraction..." : "Extraire les compétences (AI)"}
                                </button>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    Critères pour le scoring
                                </h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Compétences requises (séparées par virgule)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.required_skills}
                                        onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-primary"
                                        placeholder="React, Node.js, TypeScript"
                                    />
                                </div>
                                <div className="mt-3">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Expérience minimum (années)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.min_experience}
                                        onChange={(e) => setFormData({ ...formData, min_experience: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    {saving ? "Enregistrement..." : editingJob ? "Enregistrer" : "Créer l'offre"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                Supprimer cette offre ?
                            </h3>
                            <p className="text-sm text-gray-500">
                                Cette action est irréversible. Toutes les candidatures associées seront également supprimées.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
