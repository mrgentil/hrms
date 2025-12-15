"use client";

import React, { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { OnboardingProcess, recruitmentService } from "@/services/recruitment.service";
import { userService } from "@/services/userService";
import { User } from "@/types/api";

export default function OnboardingPage() {
    const [list, setList] = useState<OnboardingProcess[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedProcess, setSelectedProcess] = useState<OnboardingProcess | null>(null);

    const handleToggleCheck = async (process: OnboardingProcess, index: number) => {
        if (!process.checklist) return;

        const newChecklist = [...process.checklist];
        newChecklist[index].done = !newChecklist[index].done;

        // Optimistic update
        const updatedProcess = { ...process, checklist: newChecklist };
        setList(list.map(p => p.id === process.id ? updatedProcess : p));
        setSelectedProcess(updatedProcess);

        try {
            await recruitmentService.updateOnboarding(process.id, { checklist: newChecklist });
        } catch (error) {
            console.error("Failed to update checklist", error);
            // Revert on error (could reload date)
            loadData();
        }
    };
    const [users, setUsers] = useState<User[]>([]);

    const [formData, setFormData] = useState({
        employeeId: 0,
        mentorId: 0,
        startDate: "",
    });

    useEffect(() => {
        loadData();
        loadUsers();
    }, []);

    const loadData = async () => {
        try {
            const data = await recruitmentService.getOnboardingList();
            setList(data);
        } catch (error) {
            console.error("Failed to load onboarding list", error);
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            // Fetch users for dropdowns (limit 100 for now)
            const response = await userService.getUsers({ limit: 100 });
            setUsers(response.data);
        } catch (error) {
            console.error("Failed to load users", error);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.employeeId || !formData.startDate) {
            alert("Veuillez remplir tous les champs obligatoires");
            return;
        }
        setSaving(true);
        try {
            await recruitmentService.createOnboarding({
                employeeId: formData.employeeId,
                mentorId: formData.mentorId || undefined,
                startDate: formData.startDate,
                checklist: [
                    { title: "Accès badge", done: false },
                    { title: "Configuration poste", done: false },
                    { title: "Présentation équipe", done: false },
                    { title: "Formation outils", done: false },
                    { title: "Entretien RH", done: false },
                ],
            });
            setShowModal(false);
            setFormData({ employeeId: 0, mentorId: 0, startDate: "" });
            loadData();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la création");
        } finally {
            setSaving(false);
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case "PRE_BOARDING": return { label: "Pré-boarding", color: "bg-blue-100 text-blue-800" };
            case "WEEK_1": return { label: "Semaine 1", color: "bg-amber-100 text-amber-800" };
            case "MONTH_1": return { label: "Mois 1", color: "bg-purple-100 text-purple-800" };
            case "COMPLETED": return { label: "Terminé", color: "bg-green-100 text-green-800" };
            default: return { label: status, color: "bg-gray-100 text-gray-800" };
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
            <PageBreadcrumb pageTitle="Onboarding" />

            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Suivi d'intégration</h2>
                    <p className="text-sm text-gray-500">Accompagnez les nouveaux collaborateurs</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90"
                >
                    + Nouvel onboarding
                </button>
            </div>

            {list.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center text-gray-500">
                    <p>Aucun processus d'onboarding en cours.</p>
                    <button onClick={() => setShowModal(true)} className="text-primary hover:underline mt-2">
                        Démarrer un onboarding
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {list.map((item) => {
                        const statusInfo = getStatusInfo(item.status);
                        const checklistProgress = item.checklist
                            ? Math.round((item.checklist.filter((c: any) => c.done).length / item.checklist.length) * 100) || 0
                            : 0;

                        return (
                            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                        {item.employee?.full_name?.charAt(0) || "?"}
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                                        {statusInfo.label}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                    {item.employee?.full_name || "Nouvel employé"}
                                </h3>
                                <p className="text-gray-500 text-sm mb-4">{item.employee?.position?.title || "Poste"}</p>

                                <div className="mb-4">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-500">Progression</span>
                                        <span className="font-semibold text-primary">{checklistProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${checklistProgress}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span>📅</span>
                                        <span>Début : {new Date(item.start_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>🎓</span>
                                        <span>Mentor : {item.mentor?.full_name || "Non assigné"}</span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <button
                                        onClick={() => setSelectedProcess(item)}
                                        className="w-full py-2 text-sm text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
                                    >
                                        Voir la checklist
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                            Nouvel Onboarding
                        </h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nouvel employé *</label>
                                <select
                                    required
                                    value={formData.employeeId}
                                    onChange={(e) => setFormData({ ...formData, employeeId: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value={0}>-- Sélectionner --</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>{user.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Mentor</label>
                                <select
                                    value={formData.mentorId}
                                    onChange={(e) => setFormData({ ...formData, mentorId: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value={0}>-- Aucun --</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>{user.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Date de début *</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg">
                                    Annuler
                                </button>
                                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">
                                    {saving ? "..." : "Démarrer"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Checklist Modal */}
            {selectedProcess && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {selectedProcess.employee?.full_name}
                            </h2>
                            <button onClick={() => setSelectedProcess(null)} className="text-gray-500 hover:text-gray-700">
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Checklist d'intégration</h3>
                            {selectedProcess.checklist?.map((item: any, index: number) => (
                                <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <input
                                        type="checkbox"
                                        checked={item.done}
                                        onChange={() => handleToggleCheck(selectedProcess, index)}
                                        className="h-5 w-5 text-primary rounded border-gray-300 focus:ring-primary"
                                    />
                                    <span className={item.done ? "line-through text-gray-400" : "text-gray-700 dark:text-gray-300"}>
                                        {item.title}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button onClick={() => setSelectedProcess(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
