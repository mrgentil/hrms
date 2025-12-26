"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import TrainingService from "@/services/training.service";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { unwrap } from "react";

export default function EditCategoryPage({ params }: { params: any }) {
    const router = useRouter();
    const toast = useToast();
    // Unwrap params using React 19 / Next.js 15 pattern if needed, or normal await
    // The user environment is Next.js 15.2.3, params are async in some ctx but mostly directly usable in client components if passed as prop?
    // Wait, in Next 15 App Router server components params are promises. In client components?
    // Usually in client components `params` is available but if it's a server component wrapper...
    // Let's assume params might need unwrapping or are just props.
    // Safest is to use `use` from react if available or just await if it's server. But this is "use client".
    // Actually, for "use client" pages receiving params, they are props.

    const [id, setId] = useState<number>(0);

    useEffect(() => {
        // Handling Params: In Next.js 15 params might be a Promise.
        // Let's check if it is thenable.
        Promise.resolve(params).then((resolvedParams: any) => {
            if (resolvedParams?.id) {
                setId(parseInt(resolvedParams.id));
                loadCategory(parseInt(resolvedParams.id));
            }
        });

    }, [params]);

    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        color: "#3C50E0",
    });

    const loadCategory = async (categoryId: number) => {
        try {
            setLoading(true);
            // We don't have getCategoryById in Service for *Categories* specifically? 
            // Wait, TrainingService.getCategories() returns all. Efficient enough for now?
            // Or I should add getCategoryById?
            // The backend doesn't seem to expose specific GET category/:id in my previous reading.
            // I only added findAll and Create.
            // Wait, let's check TrainingController again.
            // I probably missed adding GET /categories/:id.
            // I will fetch all and find client side for now to save time, unless list is huge.
            const categories = await TrainingService.getCategories();
            const category = categories.find((c: any) => c.id === categoryId);

            if (category) {
                setFormData({
                    name: category.name,
                    description: category.description || "",
                    color: category.color || "#3C50E0",
                });
            } else {
                toast.error("Catégorie introuvable");
                router.push("/training/categories");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erreur de chargement");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return toast.error("Le nom est requis");

        try {
            setSubmitting(true);
            await TrainingService.updateCategory(id, formData);
            toast.success("Catégorie mise à jour");
            router.push("/training/categories");
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la mise à jour");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Chargement...</div>;

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <PageBreadcrumb pageTitle="Modifier Catégorie" />

            <form onSubmit={handleSubmit}>
                <ComponentCard title="Modifier la catégorie">
                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">
                            Nom de la catégorie <span className="text-meta-1">*</span>
                        </label>
                        <input
                            type="text"
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
                        {submitting ? "Enregistrement..." : "Sauvegarder les modifications"}
                    </button>
                </ComponentCard>
            </form>
        </div>
    );
}
