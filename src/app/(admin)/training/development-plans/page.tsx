"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import TrainingService from "@/services/training.service";
import { Target, TrendingUp, CheckCircle2, Sparkles, ChevronRight } from "lucide-react";

export default function DevelopmentPlansPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [plansData, recommendationsData] = await Promise.all([
                TrainingService.getMyDevelopmentPlans(),
                TrainingService.getRecommendations()
            ]);
            setPlans(plansData);
            setRecommendations(recommendationsData);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <PageBreadcrumb pageTitle="Mon Plan de Développement" />

            {loading ? (
                <div className="text-center py-10">Chargement...</div>
            ) : plans.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aucun plan défini</h3>
                    <p className="text-gray-500 mb-6">Vous n'avez pas encore de plan de développement actif.</p>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Demander un plan
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    {plans.map((plan) => (
                        <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.title}</h2>
                                    <p className="text-gray-600 dark:text-gray-400">{plan.description}</p>
                                </div>
                                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                    {plan.status}
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 w-1/3 rounded-full"></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-2">
                                    <span>Progression globale</span>
                                    <span>33%</span>
                                </div>
                            </div>

                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                Objectifs
                            </h3>

                            <div className="space-y-4">
                                {plan.objectives?.map((obj: any) => (
                                    <div
                                        key={obj.id}
                                        className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700"
                                    >
                                        <div className="mt-1">
                                            {obj.status === 'COMPLETED' ? (
                                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-500"></div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between">
                                                <h4 className="font-medium text-gray-900 dark:text-white">{obj.title}</h4>
                                                <span className={`text-xs px-2 py-0.5 rounded ${obj.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'
                                                    }`}>
                                                    {obj.priority}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">{obj.description}</p>
                                            {obj.skill_area && (
                                                <span className="inline-block mt-2 text-xs bg-white border px-2 py-0.5 rounded text-gray-500">
                                                    {obj.skill_area}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Recommendations Section */}
            {!loading && recommendations.length > 0 && (
                <div className="mt-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Sparkles className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recommandé pour votre carrière</h3>
                            <p className="text-sm text-gray-500">Basé sur votre poste et vos objectifs actuels</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {recommendations.map((training) => (
                            <Link
                                href="/training/catalog"
                                key={training.id}
                                className="group bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-amber-200 dark:hover:border-amber-900 transition-all"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded">
                                        {training.category?.name || "Suggestion"}
                                    </span>
                                    <span className="text-xs text-gray-400">{training.level}</span>
                                </div>
                                <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-amber-600 transition-colors mb-2">
                                    {training.title}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                                    {training.description}
                                </p>
                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50 dark:border-gray-700">
                                    <span className="text-xs font-medium text-gray-400 underline decoration-amber-200">En savoir plus</span>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-500 transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
