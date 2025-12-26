"use client";

import React, { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import TrainingService, { Registration } from "@/services/training.service";
import { useToast } from "@/hooks/useToast";

export default function MyTrainingsPage() {
    const toast = useToast();
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyRegistrations();
    }, []);

    const fetchMyRegistrations = async () => {
        try {
            setLoading(true);
            const data = await TrainingService.getMyRegistrations();
            setRegistrations(data);
        } catch (error) {
            console.error("Error fetching my trainings:", error);
            // toast.error("Erreur lors du chargement de mes formations");
        } finally {
            setLoading(false);
        }
    };

    const statusColors: any = {
        PENDING: "bg-yellow-100 text-yellow-800",
        APPROVED: "bg-blue-100 text-blue-800",
        COMPLETED: "bg-green-100 text-green-800",
        REJECTED: "bg-red-100 text-red-800",
        CANCELLED: "bg-gray-100 text-gray-800",
        NO_SHOW: "bg-orange-100 text-orange-800",
    };

    const statusLabels: any = {
        PENDING: "En attente",
        APPROVED: "Approuvé",
        COMPLETED: "Terminé",
        REJECTED: "Refusé",
        CANCELLED: "Annulé",
        NO_SHOW: "Absent",
    };

    return (
        <div className="p-6">
            <PageBreadcrumb pageTitle="Mes Formations" />

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-bold mb-4">Historique des formations</h2>

                {loading ? (
                    <div className="text-center py-10">Chargement...</div>
                ) : registrations.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        Vous n'avez pas encore d'inscriptions.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b dark:border-gray-700">
                                    <th className="pb-3 font-semibold text-gray-600 dark:text-gray-300">Formation</th>
                                    <th className="pb-3 font-semibold text-gray-600 dark:text-gray-300">Date demande</th>
                                    <th className="pb-3 font-semibold text-gray-600 dark:text-gray-300">Statut</th>
                                    <th className="pb-3 font-semibold text-gray-600 dark:text-gray-300">Niveau</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {registrations.map((reg) => (
                                    <tr key={reg.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="py-4 text-sm font-medium">
                                            <div className="flex flex-col">
                                                <span>{reg.training.title}</span>
                                                {reg.training.category && (
                                                    <span
                                                        className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block w-fit mt-1"
                                                        style={{ backgroundColor: `${reg.training.category.color}20`, color: reg.training.category.color }}
                                                    >
                                                        {reg.training.category.name}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 text-sm">
                                            {new Date(reg.requested_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-4">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[reg.status] || "bg-gray-100"
                                                    }`}
                                            >
                                                {statusLabels[reg.status] || reg.status}
                                            </span>
                                        </td>
                                        <td className="py-4 text-sm">{reg.training.level}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
