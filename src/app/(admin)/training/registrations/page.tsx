"use client";

import React, { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import TrainingService, { Registration } from "@/services/training.service";
import { useToast } from "@/hooks/useToast";

export default function RegistrationsPage() {
    const toast = useToast();
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const fetchRegistrations = async () => {
        try {
            setLoading(true);
            const data = await TrainingService.getAllRegistrations();
            setRegistrations(data);
        } catch (error) {
            console.error("Error fetching registrations:", error);
            // toast.error("Erreur lors du chargement des inscriptions");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        try {
            await TrainingService.updateRegistrationStatus(id, status);
            toast.success(`Inscription ${status === 'APPROVED' ? 'approuvée' : 'refusée'}`);
            fetchRegistrations(); // Refresh list
        } catch (error) {
            toast.error("Erreur lors de la mise à jour");
        }
    };

    const statusColors: any = {
        PENDING: "bg-yellow-100 text-yellow-800",
        APPROVED: "bg-blue-100 text-blue-800",
        COMPLETED: "bg-green-100 text-green-800",
        REJECTED: "bg-red-100 text-red-800",
        CANCELLED: "bg-gray-100 text-gray-800",
    };

    return (
        <div className="p-6">
            <PageBreadcrumb pageTitle="Gestion des Inscriptions" />

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-bold mb-4">Demandes d'inscriptions</h2>

                {loading ? (
                    <div className="text-center py-10">Chargement...</div>
                ) : registrations.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        Aucune demande d'inscription trouvée.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b dark:border-gray-700">
                                    <th className="pb-3 font-semibold text-gray-600 dark:text-gray-300">Employé</th>
                                    <th className="pb-3 font-semibold text-gray-600 dark:text-gray-300">Formation</th>
                                    <th className="pb-3 font-semibold text-gray-600 dark:text-gray-300">Date demande</th>
                                    <th className="pb-3 font-semibold text-gray-600 dark:text-gray-300">Statut</th>
                                    <th className="pb-3 font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {registrations.map((reg: any) => (
                                    <tr key={reg.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="py-4">
                                            <div className="font-medium">{reg.user?.full_name || 'Utilisateur inconnu'}</div>
                                            <div className="text-sm text-gray-500">{reg.user?.department?.name}</div>
                                        </td>
                                        <td className="py-4">
                                            <div className="font-medium">{reg.training.title}</div>
                                            <div className="text-xs text-gray-500">{reg.training.duration_hours}h</div>
                                        </td>
                                        <td className="py-4 text-sm">
                                            {new Date(reg.requested_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-4">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[reg.status] || "bg-gray-100"
                                                    }`}
                                            >
                                                {reg.status}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            {reg.status === 'PENDING' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleUpdateStatus(reg.id, 'APPROVED')}
                                                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                                    >
                                                        Accepter
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(reg.id, 'REJECTED')}
                                                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                                    >
                                                        Refuser
                                                    </button>
                                                </div>
                                            )}
                                        </td>
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
