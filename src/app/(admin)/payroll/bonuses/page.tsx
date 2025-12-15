"use client";

import React, { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { bonusService } from "@/services/payroll.service";
import { employeesService } from "@/services/employees.service";
import { useToast } from "@/hooks/useToast";
import { useUserRole, hasPermission } from "@/hooks/useUserRole";
import type { Bonus, BonusType, BonusStatus, CreateBonusDto } from "@/types/payroll.types";
import type { Employee } from "@/services/employees.service";

const BONUS_TYPE_LABELS: Record<BonusType, string> = {
    PERFORMANCE: 'Performance',
    ANNUAL: 'Prime annuelle',
    EXCEPTIONAL: 'Exceptionnelle',
    PROJECT_COMPLETION: 'Fin de projet',
    RETENTION: 'Fidélité',
    REFERRAL: 'Cooptation',
};

export default function BonusesPage() {
    const toast = useToast();
    const { role: userRole } = useUserRole();

    const [bonuses, setBonuses] = useState<Bonus[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedBonus, setSelectedBonus] = useState<Bonus | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState<CreateBonusDto>({
        user_id: 0,
        bonus_type: 'PERFORMANCE' as BonusType,
        amount: 0,
        title: '',
        description: '',
        period: '',
    });

    // Permission checks
    const canViewAll = !!userRole && hasPermission(userRole, 'payroll.bonuses');
    const canCreate = !!userRole && hasPermission(userRole, 'payroll.manage');
    const canApprove = !!userRole && (hasPermission(userRole, 'payroll.manage') || userRole.role === 'ROLE_ADMIN');

    useEffect(() => {
        loadBonuses();
        if (canCreate) {
            loadEmployees();
        }
    }, []);

    const loadBonuses = async () => {
        try {
            setLoading(true);
            const response = canViewAll
                ? await bonusService.getBonuses({})
                : await bonusService.getMyBonuses();

            setBonuses(canViewAll && 'data' in response ? response.data : response.data);
        } catch (error) {
            console.error('Erreur chargement primes:', error);
            toast.error('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const loadEmployees = async () => {
        try {
            const response = await employeesService.getEmployees({ page: 1, limit: 1000 });
            if (response.success) {
                setEmployees(response.data);
            }
        } catch (error) {
            console.error('Erreur chargement employés:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.user_id || !formData.amount || !formData.title) {
            toast.error('Veuillez remplir tous les champs obligatoires');
            return;
        }

        try {
            await bonusService.createBonus(formData);
            toast.success('Prime créée avec succès');
            setShowCreateModal(false);
            resetForm();
            loadBonuses();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors de la création');
        }
    };

    const resetForm = () => {
        setFormData({
            user_id: 0,
            bonus_type: 'PERFORMANCE' as BonusType,
            amount: 0,
            title: '',
            description: '',
            period: '',
        });
    };

    const handleSubmitForApproval = async (id: number) => {
        try {
            await bonusService.submitBonus(id);
            toast.success('Prime soumise pour approbation');
            loadBonuses();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors de la soumission');
        }
    };

    const handleReview = async (status: 'APPROVED' | 'REJECTED', comment: string) => {
        if (!selectedBonus) return;

        try {
            await bonusService.reviewBonus(selectedBonus.id, { status, approver_comment: comment });
            toast.success(`Prime ${status === 'APPROVED' ? 'approuvée' : 'rejetée'}`);
            setShowReviewModal(false);
            setSelectedBonus(null);
            loadBonuses();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors de la révision');
        }
    };

    const getStatusBadge = (status: BonusStatus) => {
        const badges: Record<BonusStatus, { color: string; label: string }> = {
            DRAFT: { color: 'gray', label: 'Brouillon' },
            PENDING: { color: 'yellow', label: 'En attente' },
            APPROVED: { color: 'green', label: 'Approuvé' },
            REJECTED: { color: 'red', label: 'Rejeté' },
            PAID: { color: 'blue', label: 'Payé' },
            CANCELLED: { color: 'gray', label: 'Annulé' },
        };

        const badge = badges[status];
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${badge.color}-100 text-${badge.color}-700 dark:bg-${badge.color}-900/30 dark:text-${badge.color}-300`}>
                {badge.label}
            </span>
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount);
    };

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('fr-FR');
    };

    // Calculate statistics
    const stats = {
        total: bonuses.length,
        pending: bonuses.filter(b => b.status === 'PENDING').length,
        approved: bonuses.filter(b => b.status === 'APPROVED').length,
        paid: bonuses.filter(b => b.status === 'PAID').length,
        totalAmount: bonuses.reduce((sum, b) => sum + parseFloat(String(b.amount)), 0),
    };

    return (
        <div className="space-y-6">
            <PageBreadcrumb pageTitle="Primes & Bonus" />

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total primes</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">En attente</p>
                            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.pending}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Payées</p>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.paid}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Montant total</p>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">{formatCurrency(stats.totalAmount)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Button */}
            {canCreate && (
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Attribuer une prime
                    </button>
                </div>
            )}

            {/* Bonuses List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-gray-500">Chargement...</p>
                    </div>
                ) : bonuses.length === 0 ? (
                    <div className="p-8 text-center">
                        <span className="text-4xl">🎁</span>
                        <p className="mt-2 text-gray-500">Aucune prime trouvée</p>
                        {canCreate && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="mt-4 text-primary hover:underline"
                            >
                                Attribuer la première prime
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    {canViewAll && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Employé</th>}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Titre</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Montant</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Période</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {bonuses.map((bonus) => (
                                    <tr key={bonus.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        {canViewAll && (
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-900 dark:text-white">{bonus.user?.full_name}</p>
                                            </td>
                                        )}
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                                {BONUS_TYPE_LABELS[bonus.bonus_type]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                                            {bonus.title}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-green-600 dark:text-green-400">
                                            {formatCurrency(parseFloat(String(bonus.amount)))}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                            {bonus.period || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(bonus.status)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                {bonus.status === 'DRAFT' && canCreate && (
                                                    <button
                                                        onClick={() => handleSubmitForApproval(bonus.id)}
                                                        className="text-primary hover:text-primary/80 text-sm font-medium"
                                                    >
                                                        Soumettre
                                                    </button>
                                                )}
                                                {canApprove && bonus.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBonus(bonus);
                                                            setShowReviewModal(true);
                                                        }}
                                                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                                                    >
                                                        Réviser
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Attribuer une prime
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Employé *
                                </label>
                                <select
                                    value={formData.user_id}
                                    onChange={(e) => setFormData({ ...formData, user_id: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                                    required
                                >
                                    <option value={0}>Sélectionner un employé</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.full_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Type de prime *
                                </label>
                                <select
                                    value={formData.bonus_type}
                                    onChange={(e) => setFormData({ ...formData, bonus_type: e.target.value as BonusType })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                                    required
                                >
                                    {Object.entries(BONUS_TYPE_LABELS).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Titre *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                                    placeholder="Ex: Prime de performance Q4"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Montant ($) *
                                </label>
                                <input
                                    type="number"
                                    value={formData.amount || ''}
                                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                                    required
                                    min="1"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Période
                                </label>
                                <input
                                    type="text"
                                    value={formData.period}
                                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                                    placeholder="Ex: Q4 2024, Janvier 2025"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                                    rows={3}
                                    placeholder="Description optionnelle..."
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

            {/* Review Modal */}
            {showReviewModal && selectedBonus && (
                <ReviewModal
                    bonus={selectedBonus}
                    onClose={() => {
                        setShowReviewModal(false);
                        setSelectedBonus(null);
                    }}
                    onReview={handleReview}
                />
            )}
        </div>
    );
}

// Review Modal Component
function ReviewModal({
    bonus,
    onClose,
    onReview,
}: {
    bonus: Bonus;
    onClose: () => void;
    onReview: (status: 'APPROVED' | 'REJECTED', comment: string) => void;
}) {
    const [comment, setComment] = useState('');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Réviser la prime
                </h3>
                <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Employé</p>
                        <p className="font-medium text-gray-900 dark:text-white">{bonus.user?.full_name}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                        <p className="font-medium text-gray-900 dark:text-white">{BONUS_TYPE_LABELS[bonus.bonus_type]}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Titre</p>
                        <p className="font-medium text-gray-900 dark:text-white">{bonus.title}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Montant</p>
                        <p className="font-bold text-xl text-gray-900 dark:text-white">
                            {formatCurrency(parseFloat(String(bonus.amount)))}
                        </p>
                    </div>
                    {bonus.description && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                            <p className="text-gray-900 dark:text-white">{bonus.description}</p>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Commentaire (optionnel)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                            rows={3}
                            placeholder="Ajouter un commentaire..."
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={() => onReview('REJECTED', comment)}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Rejeter
                        </button>
                        <button
                            onClick={() => onReview('APPROVED', comment)}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Approuver
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
