"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { companiesService, Company, CreateCompanyDto } from '@/services/companies.service';
import { toast } from 'react-hot-toast';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    PlusIcon,
    PencilIcon,
    CloseIcon,
    CheckCircleIcon,
    CloseLineIcon,
    BoxCubeIcon,
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
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

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
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

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

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
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
        setLogoFile(null);
        setLogoPreview(null);
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
        setLogoFile(null);
        setLogoPreview(company.logo_url || null);
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
                if (logoFile) {
                    await companiesService.uploadLogo(editingCompany.id, logoFile);
                }
                toast.success('Entreprise mise à jour');
            } else {
                const newCompany = await companiesService.create(formData);
                if (logoFile) {
                    await companiesService.uploadLogo(newCompany.id, logoFile);
                }
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
        const matchesStatus = filter === 'active' ? c.is_active : filter === 'inactive' ? !c.is_active : true;
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
    const paginatedCompanies = filteredCompanies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex gap-2">
                    {(['all', 'active', 'inactive'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); setCurrentPage(1); }}
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
                
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher une entreprise..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
                    />
                </div>
            </div>

            {/* Companies Table */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : filteredCompanies.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700">
                    <BoxCubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Aucune entreprise trouvée</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 shadow rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Entreprise</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Statistiques</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Devise / Langue</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Statut</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {paginatedCompanies.map(company => (
                                    <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                {company.logo_url ? (
                                                    <img src={company.logo_url} alt={company.name} className="h-10 w-10 rounded-lg object-contain bg-gray-50 border border-gray-100 dark:border-gray-600" />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-inner">
                                                        {company.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">{company.name}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">{company.email || 'Pas d\'email'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex gap-4 text-sm">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-900 dark:text-white">{company._count?.users || 0}</span>
                                                    <span className="text-xs text-gray-500">Utilisateurs</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-900 dark:text-white">{company._count?.departments || 0}</span>
                                                    <span className="text-xs text-gray-500">Départements</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
                                                <span className="flex items-center gap-1">💰 {company.currency}</span>
                                                <span className="flex items-center gap-1">🌐 {company.language.toUpperCase()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 text-xs rounded-full inline-flex items-center gap-1.5 font-medium ${company.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
                                                {company.is_active ? (
                                                    <><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active</>
                                                ) : (
                                                    <><div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Inactive</>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openEditModal(company)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors" title="Modifier">
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleToggleStatus(company)} className={`p-2 rounded-lg transition-colors ${company.is_active ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'}`} title={company.is_active ? 'Désactiver' : 'Réactiver'}>
                                                    {company.is_active ? <CloseLineIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex items-center justify-between">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Affichage de <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> à <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredCompanies.length)}</span> sur <span className="font-medium">{filteredCompanies.length}</span> entreprises
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
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
                                    {/* Logo Upload */}
                                    <div className="flex justify-center mb-6">
                                        <div className="relative group cursor-pointer">
                                            <div className={`h-24 w-24 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-700 ${logoPreview ? 'border-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                                                {logoPreview ? (
                                                    <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-2" />
                                                ) : (
                                                    <div className="text-center">
                                                        <BoxCubeIcon className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                                                        <span className="text-xs text-gray-400">Logo</span>
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/png, image/jpeg, image/webp"
                                                onChange={handleLogoChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                <PencilIcon className="h-6 w-6 text-white" />
                                            </div>
                                        </div>
                                    </div>

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
