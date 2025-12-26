"use client";

import React, { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import TrainingService from "@/services/training.service";
import { BadgeCheck, Calendar, Award, Settings } from "lucide-react"; // Using lucide-react icons
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function CertificationsPage() {
    const [certifications, setCertifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const isAdmin = (user?.role as any) === 'ROLE_SUPER_ADMIN' || (user?.role_info?.name === 'Super Admin') || (user?.role as any) === 'ROLE_RH';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await TrainingService.getMyCertifications();
            setCertifications(data);
        } catch (error) {
            console.error("Error fetching certifications:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <PageBreadcrumb pageTitle="Mes Certifications" />

            {isAdmin && (
                <div className="flex justify-end mb-4">
                    <Link
                        href="/training/certifications/manage"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
                    >
                        <Settings className="w-4 h-4" />
                        Gérer le catalogue
                    </Link>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* ADD CERTIFICATION BUTTON (Mock) */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition">
                    <Award className="w-10 h-10 mb-2 opacity-50" />
                    <span className="font-medium">Ajouter une certification externe</span>
                </div>

                {loading ? (
                    <div>Chargement...</div>
                ) : (
                    certifications.map((cert) => (
                        <div
                            key={cert.id}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                                <BadgeCheck className="w-24 h-24 text-blue-600" />
                            </div>

                            <div className="relative z-10">
                                <div className="mb-4">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                                        Valide
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                    {cert.certification?.name || "Certification Inconnue"}
                                </h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    {cert.certification?.issuing_org || "Organisme inconnu"}
                                </p>

                                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>Obtenu le : {new Date(cert.obtained_date).toLocaleDateString()}</span>
                                    </div>
                                    {cert.expiry_date && (
                                        <div className="flex items-center gap-2 text-orange-600">
                                            <Calendar className="w-4 h-4" />
                                            <span>Expire le : {new Date(cert.expiry_date).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <button className="text-blue-600 font-medium text-sm hover:underline">
                                        Voir la preuve
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
