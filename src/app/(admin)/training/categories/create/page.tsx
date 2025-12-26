"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import TrainingService from "@/services/training.service";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";

export default function CreateCategoryPage() {
    const router = useRouter();
    const toast = useToast();
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        color: "#3C50E0", // Default primary color
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return toast.error("Le nom est requis");

        try {
            setSubmitting(true);
            await TrainingService.createCategory(formData);
            toast.success("Catégorie créée avec succès");
            router.push("/training/categories");
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la création");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <PageBreadcrumb pageTitle="Nouvelle Catégorie" />

            <form onSubmit={handleSubmit}>
                <ComponentCard title="Détails de la catégorie">
                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">
                            Nom de la catégorie <span className="text-meta-1">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Ex: Développement Web"
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">
                            Description
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Description courte..."
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">
                            Couleur (Badge)
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                className="h-10 w-14 cursor-pointer rounded border border-stroke dark:border-strokedark"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            />
                            <span className="text-sm">{formData.color}</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90 disabled:opacity-50"
                    >
                        {submitting ? "Création en cours..." : "Créer la catégorie"}
                    </button>
                </ComponentCard>
            </form>
        </div>
    );
}
