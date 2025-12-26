"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import TrainingService from "@/services/training.service";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateCertificationPage() {
    const router = useRouter();
    const toast = useToast();
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        issuing_org: "",
        validity_months: 0,
        description: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.issuing_org) {
            return toast.error("Nom et Organisme requis");
        }

        try {
            setSubmitting(true);
            await TrainingService.createCertification({
                ...formData,
                validity_months: formData.validity_months ? parseInt(String(formData.validity_months)) : undefined
            });
            toast.success("Certification créée");
            router.push("/training/certifications/manage");
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la création");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <div className="mb-6">
                <Link href="/training/certifications/manage" className="text-gray-500 hover:text-gray-700 flex items-center gap-2 mb-2">
                    <ArrowLeft className="w-4 h-4" />
                    Retour au catalogue
                </Link>
                <PageBreadcrumb pageTitle="Nouvelle Certification" />
            </div>

            <form onSubmit={handleSubmit}>
                <ComponentCard title="Détails de la certification">
                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">
                            Nom de la certification <span className="text-meta-1">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Ex: AWS Solutions Architect"
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">
                            Organisme <span className="text-meta-1">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Ex: Amazon Web Services"
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            value={formData.issuing_org}
                            onChange={(e) => setFormData({ ...formData, issuing_org: e.target.value })}
                            required
                        />
                    </div>

                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">
                            Validité (Mois) - Laisser 0 si illimité
                        </label>
                        <input
                            type="number"
                            min="0"
                            placeholder="Ex: 36"
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            value={formData.validity_months}
                            onChange={(e) => setFormData({ ...formData, validity_months: parseInt(e.target.value) })}
                        />
                    </div>

                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">
                            Description
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Description..."
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90 disabled:opacity-50"
                    >
                        {submitting ? "Création en cours..." : "Créer la certification"}
                    </button>
                </ComponentCard>
            </form>
        </div>
    );
}
