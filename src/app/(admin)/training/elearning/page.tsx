"use client";

import React, { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import TrainingService from "@/services/training.service";
import { PlayCircle, Trophy, BookOpen, Plus, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";

export default function ElearningPage() {
    const { user } = useAuth();
    const isAdmin = (user?.role as any) === 'ROLE_SUPER_ADMIN' || (user?.role_info?.name === 'Super Admin') || (user?.role as any) === 'ROLE_RH';
    const toast = useToast();
    const [modules, setModules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await TrainingService.getElearningModules();
            setModules(data);
        } catch (error) {
            console.error("Error fetching e-learning:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartModule = async (id: number) => {
        toast.info("Démarrage du module...");
        // Integration logic to start module would go here
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Voulez-vous vraiment supprimer ce module ?")) {
            try {
                await TrainingService.deleteElearningModule(id);
                setModules(modules.filter((m) => m.id !== id));
                toast.success("Module supprimé !");
            } catch (error) {
                toast.error("Erreur lors de la suppression");
            }
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <PageBreadcrumb pageTitle="E-Learning" />
                {isAdmin && (
                    <Link
                        href="/training/elearning/create"
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                        <Plus className="w-4 h-4" />
                        Ajouter un module
                    </Link>
                )}
            </div>

            {/* Hero Section */}
            <div className="relative rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-8 mb-8 overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2">Apprenez à votre rythme</h2>
                    <p className="opacity-90 max-w-xl mb-6">
                        Accédez à des centaines de modules de formation en ligne pour développer vos compétences professionnelles partout, tout le temps.
                    </p>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                            <Trophy className="w-5 h-5" />
                            <span className="font-bold">12 Badges gagnés</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                            <BookOpen className="w-5 h-5" />
                            <span className="font-bold">4 Modules en cours</span>
                        </div>
                    </div>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/3 opacity-20 bg-white transform skew-x-12 translate-x-12"></div>
            </div>

            {/* Modules Grid */}
            <h3 className="text-xl font-bold mb-4 dark:text-white">Modules recommandés</h3>

            {loading ? (
                <div className="text-center py-10">Chargement...</div>
            ) : modules.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    Aucun module disponible pour le moment.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((module) => (
                        <div
                            key={module.id}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 overflow-hidden group"
                        >
                            <div className="h-48 bg-gray-200 relative group-hover:scale-105 transition-transform duration-500">
                                {module.thumbnail_url ? (
                                    <img src={module.thumbnail_url} alt={module.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                        <PlayCircle className="w-16 h-16 text-white/50" />
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm">
                                    {module.duration_minutes} min
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="flex gap-2">
                                    <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                                        {module.category?.name || "Général"}
                                    </span>
                                    {isAdmin && (
                                        <div className="flex gap-1 ml-auto">
                                            <Link
                                                href={`/training/elearning/${module.id}/edit`}
                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                title="Modifier"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(module.id)}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white line-clamp-1">{module.title}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                                    {module.description}
                                </p>

                                {/* Progress Bar Mockup */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>Progression</span>
                                        <span>0%</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-600 w-0"></div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleStartModule(module.id)}
                                    className="w-full py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 transition flex items-center justify-center gap-2"
                                >
                                    <PlayCircle className="w-4 h-4" />
                                    Commencer
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
