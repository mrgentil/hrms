"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api.client';
import { toast } from 'react-hot-toast';
import {
    BoxCubeIcon,
    CalenderIcon,
    TimeIcon,
    DollarLineIcon,
    PencilIcon,
} from '@/icons';

interface CompanySettings {
    id: number;
    name: string;
    logo_url: string | null;
    primary_color: string | null;
    secondary_color: string | null;
    country: string | null;
    timezone: string;
    currency: string;
    language: string;
    working_days: string[] | null;
    daily_work_hours: number | null;
    probation_period: number | null;
    fiscal_year_start: number | null;
}

const WEEK_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export default function CompanySettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [company, setCompany] = useState<CompanySettings | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isAdmin = user?.role === 'ROLE_SUPER_ADMIN' || user?.role === 'ROLE_ADMIN';
    const canEdit = isAdmin || user?.role === 'ROLE_RH';

    useEffect(() => {
        fetchCompanySettings();
    }, []);

    const fetchCompanySettings = async () => {
        try {
            const response = await apiClient.get('/company/me');
            if (response.data.success) {
                setCompany(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching company settings:', error);
            toast.error('Impossible de charger les paramètres de l\'entreprise');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!company) return;
        const { name, value } = e.target;
        setCompany({ ...company, [name]: value });
    };

    const handleDayToggle = (day: string) => {
        if (!company) return;
        const currentDays = company.working_days || [];
        const newDays = currentDays.includes(day)
            ? currentDays.filter(d => d !== day)
            : [...currentDays, day];
        setCompany({ ...company, working_days: newDays });
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Le fichier est trop volumineux (max 2MB)');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        const toastId = toast.loading('Téléchargement du logo...');

        try {
            const response = await apiClient.post('/company/me/logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.success) {
                setCompany(prev => prev ? { ...prev, logo_url: response.data.data.logo_url } : null);
                toast.success('Logo mis à jour', { id: toastId });
            }
        } catch (error) {
            console.error('Error uploading logo:', error);
            toast.error('Erreur lors du téléchargement du logo', { id: toastId });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!company) return;

        setSaving(true);
        try {
            // Validate inputs
            const payload = {
                ...company,
                fiscal_year_start: company.fiscal_year_start ? Number(company.fiscal_year_start) : undefined,
                probation_period: company.probation_period ? Number(company.probation_period) : undefined,
                daily_work_hours: company.daily_work_hours ? Number(company.daily_work_hours) : undefined,
            };

            const response = await apiClient.patch('/company/me', payload);
            if (response.data.success) {
                toast.success('Paramètres sauvegardés');
                setCompany(response.data.data);
            }
        } catch (error: any) {
            console.error('Error saving settings:', error);
            toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8">Chargement...</div>;
    }

    if (!company) {
        return <div className="p-8 text-center text-red-500">Erreur lors du chargement des données.</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuration de l'Entreprise</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gérez l'identité et les paramètres globaux de votre organisation.</p>
                </div>
                {canEdit && (
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Branding Section */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <PencilIcon className="h-5 w-5 text-indigo-500" /> Branding
                        </h2>

                        <div className="mb-6 text-center">
                            <div className="mt-2 mx-auto h-32 w-full max-w-[200px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden relative bg-gray-50 dark:bg-gray-900">
                                {company.logo_url ? (
                                    <img src={company.logo_url} alt="Logo" className="h-full w-full object-contain p-2" />
                                ) : (
                                    <span className="text-gray-400 text-sm">Aucun logo</span>
                                )}
                            </div>

                            {canEdit && (
                                <div className="mt-4">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleLogoUpload}
                                        accept="image/png, image/jpeg, image/webp"
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                                    >
                                        Changer le logo
                                    </button>
                                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP (max 2MB)</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Couleur Principale</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        name="primary_color"
                                        value={company.primary_color || '#4F46E5'}
                                        onChange={handleInputChange}
                                        disabled={!canEdit}
                                        className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                                    />
                                    <input
                                        type="text"
                                        name="primary_color"
                                        value={company.primary_color || ''}
                                        onChange={handleInputChange}
                                        disabled={!canEdit}
                                        placeholder="#4F46E5"
                                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Couleur Secondaire</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        name="secondary_color"
                                        value={company.secondary_color || '#10B981'}
                                        onChange={handleInputChange}
                                        disabled={!canEdit}
                                        className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                                    />
                                    <input
                                        type="text"
                                        name="secondary_color"
                                        value={company.secondary_color || ''}
                                        onChange={handleInputChange}
                                        disabled={!canEdit}
                                        placeholder="#10B981"
                                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Settings Form */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <BoxCubeIcon className="h-5 w-5 text-indigo-500" /> Informations Générales
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom de l'Entreprise</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={company.name}
                                    onChange={handleInputChange}
                                    disabled={!isAdmin} // Seul l'admin peut changer le nom
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:bg-gray-100"
                                />
                                {!isAdmin && <p className="mt-1 text-xs text-gray-500">Seuls les administrateurs peuvent modifier le nom.</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pays (Siège)</label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                        <BoxCubeIcon className="h-4 w-4" />
                                    </span>
                                    <input
                                        type="text"
                                        name="country"
                                        value={company.country || ''}
                                        onChange={handleInputChange}
                                        disabled={!canEdit}
                                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fuseau Horaire</label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                        <BoxCubeIcon className="h-4 w-4" />
                                    </span>
                                    <select
                                        name="timezone"
                                        value={company.timezone}
                                        onChange={handleInputChange}
                                        disabled={!canEdit}
                                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                                    >
                                        <option value="UTC">UTC</option>
                                        <option value="Europe/Paris">Europe/Paris</option>
                                        <option value="Africa/Kinshasa">Africa/Kinshasa</option>
                                        <option value="America/New_York">America/New_York</option>
                                        {/* Ajouter d'autres timezones si nécessaire */}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Devise (Défaut)</label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                        <DollarLineIcon className="h-4 w-4" />
                                    </span>
                                    <input
                                        type="text"
                                        name="currency"
                                        value={company.currency}
                                        onChange={handleInputChange}
                                        disabled={!canEdit}
                                        maxLength={3}
                                        placeholder="USD"
                                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 uppercase"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">Code ISO 4217 (ex: USD, EUR)</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Langue Principale</label>
                                <select
                                    name="language"
                                    value={company.language}
                                    onChange={handleInputChange}
                                    disabled={!canEdit}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="fr">Français</option>
                                    <option value="en">English</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <CalenderIcon className="h-5 w-5 text-indigo-500" /> Règles RH & Organisation
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Jours Travaillés</label>
                                <div className="flex flex-wrap gap-2">
                                    {WEEK_DAYS.map(day => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => canEdit && handleDayToggle(day)}
                                            disabled={!canEdit}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${(company.working_days || []).includes(day)
                                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                                : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                                                }`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Heures / Jour</label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <TimeIcon className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="number"
                                            name="daily_work_hours"
                                            value={company.daily_work_hours || ''}
                                            onChange={handleInputChange}
                                            disabled={!canEdit}
                                            min="1"
                                            max="24"
                                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Période d'essai (Mois)</label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <CalenderIcon className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="number"
                                            name="probation_period"
                                            value={company.probation_period || ''}
                                            onChange={handleInputChange}
                                            disabled={!canEdit}
                                            min="0"
                                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Début Année Fiscale (Mois)</label>
                                    <select
                                        name="fiscal_year_start"
                                        value={company.fiscal_year_start || 1}
                                        onChange={handleInputChange}
                                        disabled={!canEdit}
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                            <option key={month} value={month}>{new Date(0, month - 1).toLocaleString('fr-FR', { month: 'long' })}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
