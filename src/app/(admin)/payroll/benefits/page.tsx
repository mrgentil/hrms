"use client";

import React, { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { benefitService } from "@/services/payroll.service";
import { useToast } from "@/hooks/useToast";
import { useUserRole, hasPermission } from "@/hooks/useUserRole";
import type { BenefitCatalog, EmployeeBenefit, BenefitType, CreateBenefitCatalogDto } from "@/types/payroll.types";

const BENEFIT_TYPE_LABELS: Record<BenefitType, string> = {
    HEALTH_INSURANCE: 'Assurance santé',
    MEAL_VOUCHERS: 'Tickets restaurant',
    TRANSPORT: 'Transport',
    PHONE: 'Téléphone',
    GYM: 'Salle de sport',
    TRAINING: 'Formation',
    REMOTE_WORK: 'Télétravail',
    OTHER: 'Autre',
};

const BENEFIT_TYPE_ICONS: Record<BenefitType, string> = {
    HEALTH_INSURANCE: '🏥',
    MEAL_VOUCHERS: '🍽️',
    TRANSPORT: '🚗',
    PHONE: '📱',
    GYM: '💪',
    TRAINING: '📚',
    REMOTE_WORK: '🏠',
    OTHER: '✨',
};

export default function BenefitsPage() {
    const toast = useToast();
    const { role: userRole } = useUserRole();

    const [benefits, setBenefits] = useState<BenefitCatalog[]>([]);
    const [myBenefits, setMyBenefits] = useState<EmployeeBenefit[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'catalog' | 'my'>('catalog');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [selectedBenefit, setSelectedBenefit] = useState<BenefitCatalog | null>(null);

    // Form state
    const [formData, setFormData] = useState<CreateBenefitCatalogDto>({
        name: '',
        description: '',
        benefit_type: 'OTHER' as BenefitType,
        value_type: 'FIXED',
        value_amount: 0,
        employer_contribution: 0,
        employee_contribution: 0,
    });

    const [enrollData, setEnrollData] = useState({
        start_date: new Date().toISOString().split('T')[0],
        custom_value: 0,
    });

    // Permission checks
    const canManage = !!userRole && (hasPermission(userRole, 'payroll.manage') || userRole.role === 'ROLE_ADMIN');
    const canEnroll = !!userRole;

    useEffect(() => {
        loadBenefits();
        loadMyBenefits();
    }, []);

    const loadBenefits = async () => {
        try {
            setLoading(true);
            const response = await benefitService.getBenefits({ is_active: true });
            setBenefits(response.data);
        } catch (error) {
            console.error('Erreur chargement avantages:', error);
            toast.error('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const loadMyBenefits = async () => {
        try {
            const response = await benefitService.getMyBenefits();
            setMyBenefits(response.data);
        } catch (error) {
            console.error('Erreur chargement mes avantages:', error);
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.description) {
            toast.error('Veuillez remplir tous les champs obligatoires');
            return;
        }

        try {
            await benefitService.createBenefit(formData);
            toast.success('Avantage créé avec succès');
            setShowCreateModal(false);
            resetForm();
            loadBenefits();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors de la création');
        }
    };

    const handleEnrollSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedBenefit) return;

        try {
            await benefitService.enrollBenefit({
                benefit_id: selectedBenefit.id,
                start_date: enrollData.start_date,
                custom_value: enrollData.custom_value || undefined,
            });
            toast.success('Inscription réussie');
            setShowEnrollModal(false);
            setSelectedBenefit(null);
            setEnrollData({ start_date: new Date().toISOString().split('T')[0], custom_value: 0 });
            loadMyBenefits();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors de l\'inscription');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            benefit_type: 'OTHER' as BenefitType,
            value_type: 'FIXED',
            value_amount: 0,
            employer_contribution: 0,
            employee_contribution: 0,
        });
    };

    const formatCurrency = (amount: number | undefined) => {
        if (!amount && amount !== 0) return '-';
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount);
    };

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('fr-FR');
    };

    const isEnrolled = (benefitId: number) => {
        return myBenefits.some(mb => mb.benefit_id === benefitId && mb.status === 'ACTIVE');
    };

    return (
        <div className="space-y-6">
            <PageBreadcrumb pageTitle="Avantages Sociaux" />

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('catalog')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'catalog'
                            ? 'border-b-2 border-primary text-primary'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                >
                    Catalogue
                </button>
                <button
                    onClick={() => setActiveTab('my')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'my'
                            ? 'border-b-2 border-primary text-primary'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                >
                    Mes Avantages ({myBenefits.filter(b => b.status === 'ACTIVE').length})
                </button>
            </div>

            {/* Action Button */}
            {canManage && activeTab === 'catalog' && (
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Ajouter un avantage
                    </button>
                </div>
            )}

            {/* Catalog Tab */}
            {activeTab === 'catalog' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                        <div className="col-span-full p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-2 text-gray-500">Chargement...</p>
                        </div>
                    ) : benefits.length === 0 ? (
                        <div className="col-span-full p-8 text-center">
                            <span className="text-4xl">🎫</span>
                            <p className="mt-2 text-gray-500">Aucun avantage disponible</p>
                            {canManage && (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="mt-4 text-primary hover:underline"
                                >
                                    Ajouter le premier avantage
                                </button>
                            )}
                        </div>
                    ) : (
                        benefits.map((benefit) => (
                            <div key={benefit.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{BENEFIT_TYPE_ICONS[benefit.benefit_type]}</span>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{benefit.name}</h3>
                                            <span className="text-xs text-gray-500">{BENEFIT_TYPE_LABELS[benefit.benefit_type]}</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                    {benefit.description}
                                </p>
                                <div className="space-y-2 mb-4">
                                    {benefit.value_type === 'FIXED' && benefit.value_amount && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Valeur:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {formatCurrency(benefit.value_amount)}
                                            </span>
                                        </div>
                                    )}
                                    {benefit.employer_contribution && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Part employeur:</span>
                                            <span className="font-medium text-green-600 dark:text-green-400">
                                                {formatCurrency(benefit.employer_contribution)}
                                            </span>
                                        </div>
                                    )}
                                    {benefit.employee_contribution && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Part employé:</span>
                                            <span className="font-medium text-orange-600 dark:text-orange-400">
                                                {formatCurrency(benefit.employee_contribution)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {canEnroll && benefit.requires_enrollment && (
                                    <button
                                        onClick={() => {
                                            setSelectedBenefit(benefit);
                                            setShowEnrollModal(true);
                                        }}
                                        disabled={isEnrolled(benefit.id)}
                                        className={`w-full py-2 rounded-lg transition-colors ${isEnrolled(benefit.id)
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700'
                                                : 'bg-primary text-white hover:bg-primary/90'
                                            }`}
                                    >
                                        {isEnrolled(benefit.id) ? 'Déjà inscrit' : 'S\'inscrire'}
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* My Benefits Tab */}
            {activeTab === 'my' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {myBenefits.length === 0 ? (
                        <div className="p-8 text-center">
                            <span className="text-4xl">🎁</span>
                            <p className="mt-2 text-gray-500">Aucun avantage souscrit</p>
                            <button
                                onClick={() => setActiveTab('catalog')}
                                className="mt-4 text-primary hover:underline"
                            >
                                Consulter le catalogue
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Avantage</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date début</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Utilisation</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {myBenefits.map((enrollment) => (
                                        <tr key={enrollment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">{BENEFIT_TYPE_ICONS[enrollment.benefit?.benefit_type || 'OTHER']}</span>
                                                    <p className="font-medium text-gray-900 dark:text-white">{enrollment.benefit?.name}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                {BENEFIT_TYPE_LABELS[enrollment.benefit?.benefit_type || 'OTHER']}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                {formatDate(enrollment.start_date)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${enrollment.status === 'ACTIVE'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                        : enrollment.status === 'SUSPENDED'
                                                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                                                    }`}>
                                                    {enrollment.status === 'ACTIVE' ? 'Actif' :
                                                        enrollment.status === 'SUSPENDED' ? 'Suspendu' : 'Terminé'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                {enrollment.usage_count} fois
                                                {enrollment.last_used_at && (
                                                    <div className="text-xs text-gray-500">
                                                        Dernière: {formatDate(enrollment.last_used_at)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {enrollment.status === 'ACTIVE' && (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await benefitService.terminateEnrollment(enrollment.id);
                                                                toast.success('Avantage résilié');
                                                                loadMyBenefits();
                                                            } catch (error) {
                                                                toast.error('Erreur lors de la résiliation');
                                                            }
                                                        }}
                                                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                                                    >
                                                        Résilier
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Ajouter un avantage
                        </h3>
                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nom *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Type *
                                </label>
                                <select
                                    value={formData.benefit_type}
                                    onChange={(e) => setFormData({ ...formData, benefit_type: e.target.value as BenefitType })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                                    required
                                >
                                    {Object.entries(BENEFIT_TYPE_LABELS).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                                    rows={3}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Type de valeur
                                </label>
                                <select
                                    value={formData.value_type}
                                    onChange={(e) => setFormData({ ...formData, value_type: e.target.value as 'FIXED' | 'PERCENTAGE' })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="FIXED">Montant fixe</option>
                                    <option value="PERCENTAGE">Pourcentage</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Valeur (€)
                                </label>
                                <input
                                    type="number"
                                    value={formData.value_amount || ''}
                                    onChange={(e) => setFormData({ ...formData, value_amount: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Contribution employeur (€)
                                </label>
                                <input
                                    type="number"
                                    value={formData.employer_contribution || ''}
                                    onChange={(e) => setFormData({ ...formData, employer_contribution: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Contribution employé (€)
                                </label>
                                <input
                                    type="number"
                                    value={formData.employee_contribution || ''}
                                    onChange={(e) => setFormData({ ...formData, employee_contribution: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                                    step="0.01"
                                />
                            </div>
                            <div className="flex gap-3 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    Créer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Enroll Modal */}
            {showEnrollModal && selectedBenefit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            S'inscrire à {selectedBenefit.name}
                        </h3>
                        <form onSubmit={handleEnrollSubmit} className="space-y-4">
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                                <p className="text-sm text-gray-600 dark:text-gray-300">{selectedBenefit.description}</p>
                                {selectedBenefit.employee_contribution && (
                                    <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                                        Contribution employé: {formatCurrency(selectedBenefit.employee_contribution)}/mois
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Date de début *
                                </label>
                                <input
                                    type="date"
                                    value={enrollData.start_date}
                                    onChange={(e) => setEnrollData({ ...enrollData, start_date: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEnrollModal(false);
                                        setSelectedBenefit(null);
                                    }}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    Confirmer l'inscription
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
