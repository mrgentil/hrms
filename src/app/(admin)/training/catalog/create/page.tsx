"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import TrainingService from "@/services/training.service";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";
import { Save, ArrowLeft, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";

export default function CreateTrainingPage() {
    const router = useRouter();
    const { user } = useAuth();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);

    // Modal State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [creatingCategory, setCreatingCategory] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category_id: "",
        level: "BEGINNER",
        duration_hours: 0,
        is_online: false,
        instructor_name: "",
        image_url: "",
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const data = await TrainingService.getCategories();
            setCategories(data);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
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

        if (!formData.title || !formData.category_id) {
            toast.error("Veuillez remplir les champs obligatoires");
            return;
        }

        try {
            setLoading(true);
            await TrainingService.createTraining({
                ...formData,
                category_id: parseInt(formData.category_id),
                duration_hours: parseInt(String(formData.duration_hours)) || 0,
            });
            toast.success("Formation créée avec succès !");
            router.push("/training/catalog");
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la création de la formation");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <Link href="/training/catalog" className="text-gray-500 hover:text-gray-700 flex items-center gap-2 mb-2">
                    <ArrowLeft className="w-4 h-4" />
                    Retour au catalogue
                </Link>
                <h1 className="text-2xl font-bold">Créer une nouvelle formation</h1>
            </div>

            <div className="max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Titre de la formation *</label>
                            <input
                                type="text"
                                name="title"
                                required
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Ex: Introduction à TypeScript"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                name="description"
                                rows={4}
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Description détaillée..."
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
                            <label className="block text-sm font-medium mb-1">Niveau</label>
                            <select
                                name="level"
                                value={formData.level}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            >
                                <option value="BEGINNER">Débutant</option>
                                <option value="INTERMEDIATE">Intermédiaire</option>
                                <option value="ADVANCED">Avancé</option>
                                <option value="EXPERT">Expert</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Durée (heures)</label>
                            <input
                                type="number"
                                name="duration_hours"
                                min="0"
                                value={formData.duration_hours}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Instructeur</label>
                            <input
                                type="text"
                                name="instructor_name"
                                value={formData.instructor_name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">URL Image (optionnel)</label>
                            <input
                                type="text"
                                name="image_url"
                                value={formData.image_url}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                placeholder="https://..."
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="is_online"
                                id="is_online"
                                checked={formData.is_online}
                                onChange={handleChange}
                                className="w-4 h-4 rounded border-gray-300"
                            />
                            <label htmlFor="is_online" className="text-sm font-medium">Formation en ligne ?</label>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? "Création..." : "Créer la formation"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Modal Creation Categorie */}
            <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} className="max-w-md p-6">
                <h3 className="text-lg font-bold mb-4">Nouvelle Catégorie</h3>
                <form onSubmit={handleCreateCategory}>
                    <label className="block text-sm font-medium mb-2">Nom de la catégorie</label>
                    <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg mb-4 dark:bg-gray-700 dark:border-gray-600"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Ex: Développement Web"
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
