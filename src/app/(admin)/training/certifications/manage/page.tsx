"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";
import TrainingService from "@/services/training.service";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Edit, Trash2, Plus, ArrowLeft, Award } from "lucide-react";

export default function ManageCertificationsPage() {
    const [certifications, setCertifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        loadCertifications();
    }, []);

    const loadCertifications = async () => {
        try {
            setLoading(true);
            const data = await TrainingService.getCertifications();
            setCertifications(data);
        } catch (error) {
            console.error(error);
            toast.error("Impossible de charger les certifications");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette certification ?")) {
            try {
                await TrainingService.deleteCertification(id);
                setCertifications(certifications.filter(c => c.id !== id));
                toast.success("Certification supprimée");
            } catch (error) {
                toast.error("Erreur lors de la suppression");
            }
        }
    };

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <div className="mb-6">
                <Link href="/training/certifications" className="text-gray-500 hover:text-gray-700 flex items-center gap-2 mb-2">
                    <ArrowLeft className="w-4 h-4" />
                    Retour mes certifications
                </Link>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                        Catalogue des Certifications
                    </h2>
                    <Link
                        href="/training/certifications/manage/create"
                        className="inline-flex items-center justify-center gap-2.5 rounded-md bg-primary py-4 px-10 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                    >
                        <span>
                            <Plus />
                        </span>
                        Nouvelle Certification
                    </Link>
                </div>
            </div>

            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                                    Nom
                                </th>
                                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                                    Organisme
                                </th>
                                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                                    Validité (Mois)
                                </th>
                                <th className="py-4 px-4 font-medium text-black dark:text-white">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-4">Chargement...</td>
                                </tr>
                            ) : certifications.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-4">Aucune certification trouvée</td>
                                </tr>
                            ) : (
                                certifications.map((cert) => (
                                    <tr key={cert.id}>
                                        <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                                                    <Award className="w-5 h-5 text-primary" />
                                                </div>
                                                <h5 className="font-medium text-black dark:text-white">
                                                    {cert.name}
                                                </h5>
                                            </div>
                                        </td>
                                        <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                            <p className="text-black dark:text-white">{cert.issuing_org}</p>
                                        </td>
                                        <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                            <span className="inline-flex rounded-full bg-success bg-opacity-10 py-1 px-3 text-sm font-medium text-success">
                                                {cert.validity_months ? `${cert.validity_months} mois` : 'Illimité'}
                                            </span>
                                        </td>
                                        <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                            <div className="flex items-center space-x-3.5">
                                                <Link
                                                    href={`/training/certifications/manage/${cert.id}/edit`}
                                                    className="hover:text-primary"
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(cert.id)}
                                                    className="hover:text-danger text-red-500"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
