"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

interface ModulePlaceholderProps {
    title: string;
    description: string;
    icon?: string;
    comingSoon?: boolean;
}

export default function ModulePlaceholder({
    title,
    description,
    icon = "🚧",
    comingSoon = true,
}: ModulePlaceholderProps) {
    return (
        <div>
            <PageBreadcrumb pageTitle={title} />

            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                {/* Icon */}
                <div className="text-8xl mb-6 animate-bounce">
                    {icon}
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    {title}
                </h1>

                {/* Description */}
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mb-6">
                    {description}
                </p>

                {/* Coming Soon Badge */}
                {comingSoon && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
                        <span className="animate-pulse h-2 w-2 rounded-full bg-primary"></span>
                        <span className="text-sm font-medium text-primary">
                            Module en cours de développement
                        </span>
                    </div>
                )}

                {/* Features Preview */}
                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
                    <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="text-2xl mb-2">📊</div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Tableaux de bord</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Visualisez vos données</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="text-2xl mb-2">⚡</div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Actions rapides</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gérez efficacement</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="text-2xl mb-2">📈</div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Rapports</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Analysez les tendances</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
