"use client";

import React, { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Candidate, recruitmentService } from "@/services/recruitment.service";

export default function TalentPoolPage() {
    const [talents, setTalents] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        skills: "",
        rating: 3,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await recruitmentService.getTalentPool();
            setTalents(data);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await recruitmentService.createCandidate({
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.phone,
                skills: formData.skills.split(",").map(s => s.trim()).filter(Boolean),
                rating: formData.rating,
                is_in_talent_pool: true,
            });
            setShowModal(false);
            setFormData({ first_name: "", last_name: "", email: "", phone: "", skills: "", rating: 3 });
            loadData();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'ajout au vivier");
        } finally {
            setSaving(false);
        }
    };

    const filteredTalents = talents.filter(t => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            t.first_name?.toLowerCase().includes(searchLower) ||
            t.last_name?.toLowerCase().includes(searchLower) ||
            t.skills?.some((s: string) => s.toLowerCase().includes(searchLower))
        );
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div>
            <PageBreadcrumb pageTitle="Viviers de Talents" />

            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Base de candidats</h2>
                    <p className="text-sm text-gray-500">Profils qualifiés pour vos futurs besoins</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-4 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700"
                    />
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90"
                    >
                        + Ajouter au vivier
                    </button>
                </div>
            </div>

            {filteredTalents.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center text-gray-500">
                    <p>Aucun talent dans le vivier.</p>
                    <button onClick={() => setShowModal(true)} className="text-primary hover:underline mt-2">
                        Ajouter un profil
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredTalents.map((talent) => (
                        <div key={talent.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 group hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                                    {talent.first_name?.charAt(0)}
                                </div>
                                <div className="text-right">
                                    <div className="text-yellow-400 text-sm">
                                        {"★".repeat(talent.rating)}{"☆".repeat(5 - talent.rating)}
                                    </div>
                                </div>
                            </div>

                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-0.5">
                                {talent.first_name} {talent.last_name}
                            </h3>
                            <p className="text-primary text-sm font-medium mb-3">{talent.email}</p>

                            {talent.skills && Array.isArray(talent.skills) && (
                                <div className="flex flex-wrap gap-1.5 mb-4 max-h-16 overflow-hidden">
                                    {talent.skills.map((skill: string, i: number) => (
                                        <span key={i} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700/50 rounded text-gray-600 dark:text-gray-300">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <button className="w-full mt-4 py-2 text-sm border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors">
                                Contacter
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                            Ajouter au vivier
                        </h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Prénom *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nom *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Téléphone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Compétences (séparées par virgule)</label>
                                <input
                                    type="text"
                                    value={formData.skills}
                                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                                    placeholder="React, Node.js, TypeScript"
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Note (1-5)</label>
                                <input
                                    type="range"
                                    min={1}
                                    max={5}
                                    value={formData.rating}
                                    onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                                    className="w-full"
                                />
                                <div className="text-center text-yellow-400">
                                    {"★".repeat(formData.rating)}{"☆".repeat(5 - formData.rating)}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg">
                                    Annuler
                                </button>
                                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">
                                    {saving ? "..." : "Ajouter"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
