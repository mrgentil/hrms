"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { companiesService, Company, CreateCompanyDto } from '@/services/companies.service';
import { toast } from 'react-hot-toast';
import {
    PlusIcon,
    PencilIcon,
    CloseIcon,
    CheckCircleIcon,
    CloseLineIcon,
    BoxCubeIcon,
    GroupIcon,
} from '@/icons';

export default function CompaniesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

    // Form state
    const [formData, setFormData] = useState<CreateCompanyDto>({
        name: '',
        email: '',
        phone: '',
        address: '',
        currency: 'USD',
        timezone: 'UTC',
        language: 'fr',
    });

    const isSuperAdmin = user?.role === 'ROLE_SUPER_ADMIN';

    useEffect(() => {
        if (!isSuperAdmin) {
            toast.error('Accès réservé aux Super Administrateurs');
            router.push('/');
            return;
        }
        fetchCompanies();
    }, [isSuperAdmin, router]);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const data = await companiesService.getAll();
            setCompanies(data);
        } catch (error) {
            console.error('Error fetching companies:', error);
            toast.error('Erreur lors du chargement des entreprises');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openCreateModal = () => {
        setEditingCompany(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            address: '',
            currency: 'USD',
            timezone: 'UTC',
            language: 'fr',
        });
        setShowModal(true);
    };

    const openEditModal = (company: Company) => {
        setEditingCompany(company);
        setFormData({
            name: company.name,
            email: company.email || '',
            phone: company.phone || '',
            address: company.address || '',
            currency: company.currency,
            timezone: company.timezone,
            language: company.language,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Le nom de l\'entreprise est requis');
            return;
        }

        setSaving(true);
        try {
            if (editingCompany) {
                await companiesService.update(editingCompany.id, formData);
                toast.success('Entreprise mise à jour');
            } else {
                await companiesService.create(formData);
                toast.success('Entreprise créée');
            }
            setShowModal(false);
            fetchCompanies();
        } catch (error: any) {
            console.error('Error saving company:', error);
            toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (company: Company) => {
        try {
            if (company.is_active) {
                await companiesService.deactivate(company.id);
                toast.success('Entreprise désactivée');
            } else {
                await companiesService.reactivate(company.id);
                toast.success('Entreprise réactivée');
            }
            fetchCompanies();
        } catch (error: any) {
            console.error('Error toggling company status:', error);
            toast.error(error.response?.data?.message || 'Erreur lors du changement de statut');
        }
    };

    const filteredCompanies = companies.filter(c => {
        if (filter === 'active') return c.is_active;
        if (filter === 'inactive') return !c.is_active;
        return true;
    });

    if (!isSuperAdmin) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BoxCubeIcon className="h-7 w-7 text-indigo-500" />
                        Gestion des Entreprises
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Gérez toutes les entreprises du système
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <PlusIcon className="h-5 w-5" />
                    Nouvelle Entreprise
                </button>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-2">
                {(['all', 'active', 'inactive'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                    >
                        {f === 'all' ? 'Toutes' : f === 'active' ? 'Actives' : 'Inactives'}
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white dark:bg-gray-700">
                            {f === 'all'
                                ? companies.length
                                : f === 'active'
                                    ? companies.filter(c => c.is_active).length
                                    : companies.filter(c => !c.is_active).length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Companies Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : filteredCompanies.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow">
                    <BoxCubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Aucune entreprise trouvée</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCompanies.map(company => (
                        <div
                            key={company.id}
                            className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border-l-4 ${company.is_active
                                ? 'border-green-500'
                                : 'border-red-400 opacity-75'
                                }`}
                        >
                            {/* Company Header */}
                            <div className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        {company.logo_url ? (
                                            <img
                                                src={company.logo_url}
                                                alt={company.name}
                                                className="h-14 w-14 rounded-lg object-contain bg-gray-50"
                                            />
                                        ) : (
                                            <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                                                {company.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                                                {company.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {company.email || 'Pas d\'email'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${company.is_active
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        }`}>
                                        {company.is_active ? (
                                            <>
                                                <CheckCircleIcon />
                                                Active
                                            </>
                                        ) : (
                                            <>
                                                <CloseLineIcon />
                                                Inactive
                                            </>
                                        )}
                                    </span>
                                </div>

                                {/* Stats */}
                                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg py-3">
                                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                            {company._count?.users || 0}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Utilisateurs</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg py-3">
                                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                            {company._count?.departments || 0}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Départements</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg py-3">
                                        <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                                            {company._count?.positions || 0}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Postes</p>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                                        💰 {company.currency}
                                    </span>
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                                        🌍 {company.timezone}
                                    </span>
                                    {company.country && (
                                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                                            📍 {company.country}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-2">
                                <button
                                    onClick={() => openEditModal(company)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
                                >
                                    <PencilIcon className="h-4 w-4" />
                                    Modifier
                                </button>
                                <button
                                    onClick={() => handleToggleStatus(company)}
                                    className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${company.is_active
                                        ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50'
                                        : 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/50'
                                        }`}
                                >
                                    {company.is_active ? (
                                        <>
                                            <CloseLineIcon />
                                            Désactiver
                                        </>
                                    ) : (
                                        <>
                                            <GroupIcon />
                                            Réactiver
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div
                            className="fixed inset-0 bg-black/50 transition-opacity"
                            onClick={() => setShowModal(false)}
                        />

                        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

                        <div className="relative inline-block transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                            <form onSubmit={handleSubmit}>
                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {editingCompany ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <CloseIcon />
                                    </button>
                                </div>

                                <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Nom de l'entreprise *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                                            placeholder="Ex: Acme Corporation"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                                                placeholder="contact@company.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Téléphone
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                                                placeholder="+1 234 567 890"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Adresse
                                        </label>
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            rows={2}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                                            placeholder="123 Business Street, City"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Devise
                                            </label>
                                            <select
                                                name="currency"
                                                value={formData.currency}
                                                onChange={handleInputChange}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                                            >
                                                <option value="USD">USD ($)</option>
                                                <option value="EUR">EUR (€)</option>
                                                <option value="CDF">CDF (FC)</option>
                                                <option value="GBP">GBP (£)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Fuseau horaire
                                            </label>
                                            <select
                                                name="timezone"
                                                value={formData.timezone}
                                                onChange={handleInputChange}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                                            >
                                                <option value="UTC">UTC</option>
                                                <option value="Europe/Paris">Europe/Paris</option>
                                                <option value="Africa/Kinshasa">Africa/Kinshasa</option>
                                                <option value="America/New_York">America/New_York</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Langue
                                            </label>
                                            <select
                                                name="language"
                                                value={formData.language}
                                                onChange={handleInputChange}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                                            >
                                                <option value="fr">Français</option>
                                                <option value="en">English</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {saving ? 'Enregistrement...' : editingCompany ? 'Mettre à jour' : 'Créer'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
