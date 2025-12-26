"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import TrainingService from "@/services/training.service";
import { useToast } from "@/hooks/useToast";
import { Save, ArrowLeft, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";

export default function EditElearningModulePage({ params }: { params: any }) {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);

    const [id, setId] = useState<number>(0);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [creatingCategory, setCreatingCategory] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category_id: "",
        url: "",
        thumbnail_url: "",
        duration_minutes: 0,
        content: "",
    });

    useEffect(() => {
        Promise.resolve(params).then((p) => {
            if (p?.id) {
                const modId = parseInt(p.id);
                setId(modId);
                fetchData(modId);
            }
        });
    }, [params]);

    const fetchData = async (modId: number) => {
        try {
            setLoading(true);
            const [categoriesData, modulesData] = await Promise.all([
                TrainingService.getCategories(),
                TrainingService.getElearningModules() // Currently we fetch all on list, can find item here. Or implement getById in service. 
            ]);
            setCategories(categoriesData);

            // Optimization: Filter from list as backend has getElearningModules. 
            // Ideally backend should have getById. 
            // Assume getElearningModules returns array.
            // Wait, does TrainingService.getElearningModules() support filtering by ID? 
            // The backend endpoint accepts filters.

            // Let's rely on finding it in the full list for now as I didn't add specific GetById endpoint for elearning in controller (Wait, I added update/delete). I missed GetById?
            // Yes, I checked TrainingController, only getElearningModules (list) exists.
            // So finding in list is the way.

            const module = modulesData.find((m: any) => m.id === modId);
            if (module) {
                setFormData({
                    title: module.title,
                    description: module.description || "",
                    category_id: String(module.category_id),
                    url: module.url,
                    thumbnail_url: module.thumbnail_url || "",
                    duration_minutes: module.duration_minutes,
                    content: module.content || "",
                });
            } else {
                toast.error("Module introuvable");
                router.push("/training/elearning");
            }

        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Impossible de charger le module");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        try {
            setCreatingCategory(true);
            const newCat = await TrainingService.createCategory({ name: newCategoryName });
            toast.success("Catégorie créée !");
            setCategories([...categories, newCat]);
            setFormData(prev => ({ ...prev, category_id: String(newCat.id) }));
            setIsCategoryModalOpen(false);
            setNewCategoryName("");
        } catch (error) {
            toast.error("Erreur créat. catégorie");
        } finally {
            setCreatingCategory(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.category_id || !formData.url) {
            toast.error("Veuillez remplir les champs obligatoires");
            return;
        }

        try {
            setSubmitting(true);
            await TrainingService.updateElearningModule(id, {
                ...formData,
                category_id: parseInt(formData.category_id),
                duration_minutes: parseInt(String(formData.duration_minutes)) || 0,
            });
            toast.success("Module mis à jour !");
            router.push("/training/elearning");
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la modification");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Chargement...</div>;

    return (
        <div className="p-6">
            <div className="mb-6">
                <Link href="/training/elearning" className="text-gray-500 hover:text-gray-700 flex items-center gap-2 mb-2">
                    <ArrowLeft className="w-4 h-4" />
                    Retour e-learning
                </Link>
                <h1 className="text-2xl font-bold">Modifier le module</h1>
            </div>

            <div className="max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Titre du module *</label>
                            <input
                                type="text"
                                name="title"
                                required
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                name="description"
                                rows={3}
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Catégorie *</label>
                            <div className="flex gap-2">
                                <select
                                    name="category_id"
                                    required
                                    value={formData.category_id}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="">Sélectionner une catégorie</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryModalOpen(true)}
                                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg dark:bg-gray-700 dark:hover:bg-gray-600 transition"
                                    title="Nouvelle catégorie"
                                >
                                    <PlusCircle className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Durée (minutes)</label>
                            <input
                                type="number"
                                name="duration_minutes"
                                min="0"
                                value={formData.duration_minutes}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">URL de la vidéo/contenu *</label>
                            <input
                                type="text"
                                name="url"
                                required
                                value={formData.url}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">URL Miniature (optionnel)</label>
                            <input
                                type="text"
                                name="thumbnail_url"
                                value={formData.thumbnail_url}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Contenu texte (optionnel)</label>
                            <textarea
                                name="content"
                                rows={6}
                                value={formData.content}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 font-mono text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {submitting ? "Sauvegarde..." : "Sauvegarder"}
                        </button>
                    </div>
                </form>
            </div>

            <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} className="max-w-md p-6">
                <h3 className="text-lg font-bold mb-4">Nouvelle Catégorie</h3>
                <form onSubmit={handleCreateCategory}>
                    <label className="block text-sm font-medium mb-2">Nom de la catégorie</label>
                    <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg mb-4 dark:bg-gray-700 dark:border-gray-600"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Ex: Soft Skills"
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsCategoryModalOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={creatingCategory || !newCategoryName.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {creatingCategory ? "..." : "Créer"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
