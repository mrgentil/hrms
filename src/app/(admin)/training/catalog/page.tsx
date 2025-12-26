"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import TrainingService, { Training } from "@/services/training.service";
import { userService } from "@/services/userService";
import { useToast } from "@/hooks/useToast";
import { Search, Filter, Plus, Edit, Trash2, UserPlus, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function TrainingCatalogPage() {
    const { user } = useAuth();
    const toast = useToast();
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [myRegistrations, setMyRegistrations] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category_id: "",
        search: "",
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [trainingsData, categoriesData, myRegData] = await Promise.all([
                TrainingService.getAllTrainings(),
                TrainingService.getCategories(),
                TrainingService.getMyRegistrations()
            ]);
            setTrainings(trainingsData);
            setCategories(categoriesData);
            setMyRegistrations(myRegData.map((r: any) => r.training_id));
        } catch (error) {
            console.error("Error fetching training catalog:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (trainingId: number) => {
        try {
            await TrainingService.register({ training_id: trainingId });
            toast.success("Demande d'inscription envoyée !");
            setMyRegistrations([...myRegistrations, trainingId]);
        } catch (error) {
            toast.error("Erreur lors de l'inscription");
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Voulez-vous vraiment supprimer cette formation ?")) {
            try {
                await TrainingService.deleteTraining(id);
                setTrainings(trainings.filter(t => t.id !== id));
                toast.success("Formation supprimée !");
            } catch (error) {
                toast.error("Erreur lors de la suppression");
            }
        }
    };

    const filteredTrainings = trainings.filter((t: any) => {
        const matchCategory = filters.category_id ? t.category_id === parseInt(filters.category_id) : true;
        const matchSearch = t.title.toLowerCase().includes(filters.search.toLowerCase());
        return matchCategory && matchSearch;
    });

    const isAdmin = user?.role === 'ROLE_SUPER_ADMIN' || user?.role_info?.name === 'Super Admin' || user?.role === 'ROLE_RH';

    // Assignment state
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedTrainingForAssign, setSelectedTrainingForAssign] = useState<number | null>(null);
    const [userSearchTerm, setUserSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedUserForAssign, setSelectedUserForAssign] = useState<any | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        if (userSearchTerm.length >= 2) {
            const delayDebounceFn = setTimeout(async () => {
                try {
                    const response = await userService.searchUsers(userSearchTerm);
                    setSearchResults(response.data || []);
                } catch (error) {
                    console.error("Error searching users:", error);
                }
            }, 300);
            return () => clearTimeout(delayDebounceFn);
        } else {
            setSearchResults([]);
        }
    }, [userSearchTerm]);

    const handleAssign = async () => {
        if (!selectedTrainingForAssign || !selectedUserForAssign) return;

        try {
            setIsAssigning(true);
            await TrainingService.assignTraining({
                training_id: selectedTrainingForAssign,
                user_id: selectedUserForAssign.id
            });
            toast.success(`Formation attribuée à ${selectedUserForAssign.full_name} !`);
            setIsAssignModalOpen(false);
            setSelectedUserForAssign(null);
            setUserSearchTerm("");
        } catch (error) {
            toast.error("Erreur lors de l'attribution");
        } finally {
            setIsAssigning(false);
        }
    };


    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <PageBreadcrumb pageTitle="Catalogue des Formations" />
                {isAdmin && (
                    <Link
                        href="/training/catalog/create"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        <Plus className="w-4 h-4" />
                        Ajouter une formation
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="mb-8 flex flex-col md:flex-row gap-4 items-end bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                <div className="flex-1 w-full">
                    <label className="block text-sm font-medium mb-1">Recherche</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Rechercher une formation..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                    </div>
                </div>
                <div className="w-full md:w-64">
                    <label className="block text-sm font-medium mb-1">Catégorie</label>
                    <select
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        value={filters.category_id}
                        onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
                    >
                        <option value="">Toutes les catégories</option>
                        {categories.map((c: any) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center py-20">Chargement...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTrainings.length === 0 ? (
                        <div className="col-span-full text-center py-20 text-gray-500">
                            Aucune formation trouvée
                        </div>
                    ) : (
                        filteredTrainings.map((training) => (
                            <div
                                key={training.id}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 dark:border-gray-700"
                            >
                                <div className="h-40 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
                                    {training.image_url && (
                                        <img
                                            src={training.image_url}
                                            alt={training.title}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/50 px-2 py-1 rounded text-xs font-bold">
                                        {training.level}
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                            {training.category?.name || "Général"}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            ⏱ {training.duration_hours}h
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
                                        {training.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                                        {training.description || "Pas de description"}
                                    </p>

                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <span className="text-sm text-gray-500">
                                            {training.is_online ? "💻 En ligne" : "📍 Présentiel"}
                                        </span>
                                        <div className="flex gap-2">
                                            {isAdmin && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTrainingForAssign(training.id);
                                                            setIsAssignModalOpen(true);
                                                        }}
                                                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition"
                                                        title="Attribuer à un employé"
                                                    >
                                                        <UserPlus className="w-5 h-5" />
                                                    </button>
                                                    <Link
                                                        href={`/training/catalog/${training.id}/edit`}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"
                                                        title="Modifier"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(training.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleRegister(training.id)}
                                                disabled={myRegistrations.includes(training.id)}
                                                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${myRegistrations.includes(training.id)
                                                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                                    }`}
                                            >
                                                {myRegistrations.includes(training.id) ? "En attente" : "S'inscrire"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Modal d'attribution */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Attribuer la formation</h3>
                            <button onClick={() => {
                                setIsAssignModalOpen(false);
                                setSelectedUserForAssign(null);
                                setUserSearchTerm("");
                            }} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Rechercher l'employé
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        autoFocus
                                        className="w-full pl-10 pr-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-purple-500"
                                        placeholder="Tapez le nom de l'utilisateur..."
                                        value={userSearchTerm}
                                        onChange={(e) => setUserSearchTerm(e.target.value)}
                                    />
                                    <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                                </div>

                                {/* Résultats de recherche */}
                                {searchResults.length > 0 && (
                                    <div className="mt-2 border rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 max-h-48 overflow-y-auto shadow-sm">
                                        {searchResults.map((userSearchResult) => (
                                            <button
                                                key={userSearchResult.id}
                                                onClick={() => {
                                                    setSelectedUserForAssign(userSearchResult);
                                                    setUserSearchTerm(userSearchResult.full_name);
                                                    setSearchResults([]);
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition text-sm flex items-center gap-3 border-b dark:border-gray-800 last:border-0"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 font-bold">
                                                    {userSearchResult.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">{userSearchResult.full_name}</div>
                                                    <div className="text-xs text-gray-500">{userSearchResult.role_info?.name}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedUserForAssign && (
                                <div className="mb-6 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl flex items-center gap-3 border border-purple-100 dark:border-purple-800">
                                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                                        {selectedUserForAssign.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-purple-900 dark:text-purple-100">{selectedUserForAssign.full_name}</div>
                                        <div className="text-xs text-purple-700 dark:text-purple-300">Sélectionné pour l'attribution</div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsAssignModalOpen(false);
                                        setSelectedUserForAssign(null);
                                        setUserSearchTerm("");
                                    }}
                                    className="flex-1 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium dark:border-gray-600 dark:hover:bg-gray-700"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleAssign}
                                    disabled={!selectedUserForAssign || isAssigning}
                                    className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isAssigning ? "Attribution..." : "Confirmer"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
