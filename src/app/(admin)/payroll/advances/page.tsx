"use client";

import React, { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { advanceService } from "@/services/payroll.service";
import { useToast } from "@/hooks/useToast";
import { useUserRole, hasPermission } from "@/hooks/useUserRole";
import { SalaryAdvance, AdvanceStatus, FundRequestStatus } from "@/types/payroll.types";

export default function AdvancesPage() {
    const toast = useToast();
    const { role: userRole } = useUserRole();

    const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
    const [loading, setLoading] = useState(true);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [selectedAdvance, setSelectedAdvance] = useState<SalaryAdvance | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        amount: '',
        reason: '',
        needed_by_date: '',
        repayment_months: '3',
    });

    // Permission checks
    const canViewAll = !!userRole && hasPermission(userRole, 'payroll.advances');
    const canApprove = !!userRole && hasPermission(userRole, 'payroll.manage');
    const isEmployee = userRole?.role === 'ROLE_EMPLOYEE';

    useEffect(() => {
        loadAdvances();
    }, []);

    const loadAdvances = async () => {
        try {
            setLoading(true);
            const response = canViewAll
                ? await advanceService.getAdvances({})
                : await advanceService.getMyAdvances();

            setAdvances(canViewAll && 'data' in response ? response.data : response.data);
        } catch (error) {
            console.error('Erreur chargement avances:', error);
            toast.error('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.amount || !formData.reason) {
            toast.error('Veuillez remplir tous les champs obligatoires');
            return;
        }

        try {
            await advanceService.createAdvance({
                amount: parseFloat(formData.amount),
                reason: formData.reason,
                needed_by_date: formData.needed_by_date || undefined,
                repayment_months: parseInt(formData.repayment_months),
            });

            toast.success('Demande d\'avance créée avec succès');
            setShowRequestModal(false);
            setFormData({ amount: '', reason: '', needed_by_date: '', repayment_months: '3' });
            loadAdvances();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors de la création');
        }
    };

    const handleSubmitForApproval = async (id: number) => {
        try {
            await advanceService.submitAdvance(id);
            toast.success('Demande soumise pour approbation');
            loadAdvances();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors de la soumission');
        }
    };

    const handleReview = async (status: 'APPROVED' | 'REJECTED', comment: string) => {
        if (!selectedAdvance) return;

        try {
            const reviewStatus = status === 'APPROVED' ? AdvanceStatus.APPROVED : AdvanceStatus.REJECTED;
            await advanceService.reviewAdvance(selectedAdvance.id, {
                status: reviewStatus,
                reviewer_comment: comment
            });
            toast.success(`Demande ${status === 'APPROVED' ? 'approuvée' : 'rejetée'}`);
            setShowReviewModal(false);
            setSelectedAdvance(null);
            loadAdvances();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors de la révision');
        }
    };

    const getStatusBadge = (status: AdvanceStatus) => {
        const badges: Record<AdvanceStatus, { color: string; label: string }> = {
            DRAFT: { color: 'gray', label: 'Brouillon' },
            PENDING: { color: 'yellow', label: 'En attente' },
            APPROVED: { color: 'green', label: 'Approuvé' },
            REJECTED: { color: 'red', label: 'Rejeté' },
            PAID: { color: 'blue', label: 'Payé' },
            REPAYING: { color: 'purple', label: 'Remboursement' },
            COMPLETED: { color: 'teal', label: 'Terminé' },
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
        total: advances.length,
        pending: advances.filter(a => a.status === 'PENDING').length,
        approved: advances.filter(a => a.status === 'APPROVED' || a.status === 'PAID' || a.status === 'REPAYING').length,
        totalAmount: advances.reduce((sum, a) => sum + parseFloat(String(a.amount)), 0),
    };

    return (
        <div className="space-y-6">
            <PageBreadcrumb pageTitle="Avances sur Salaire" />

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total demandes</p>
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
                        <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Approuvées</p>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.approved}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Montant total</p>
                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{formatCurrency(stats.totalAmount)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end">
                <button
                    onClick={() => setShowRequestModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nouvelle demande
                </button>
            </div>

            {/* Advances List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-gray-500">Chargement...</p>
                    </div>
                ) : advances.length === 0 ? (
                    <div className="p-8 text-center">
                        <span className="text-4xl">💵</span>
                        <p className="mt-2 text-gray-500">Aucune demande d'avance trouvée</p>
                        <button
                            onClick={() => setShowRequestModal(true)}
                            className="mt-4 text-primary hover:underline"
                        >
                            Créer votre première demande
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    {canViewAll && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Employé</th>}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Montant</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Raison</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date demandée</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Remboursement</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {advances.map((advance) => (
                                    <tr key={advance.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        {canViewAll && (
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{advance.user?.full_name}</p>
                                                    <p className="text-sm text-gray-500">{advance.user?.department?.name || '-'}</p>
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(parseFloat(String(advance.amount)))}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                            {advance.reason.substring(0, 50)}{advance.reason.length > 50 ? '...' : ''}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                            {formatDate(advance.requested_date)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                            {advance.repayment_months ? `${advance.repayment_months} mois` : '-'}
                                            {advance.monthly_deduction && (
                                                <div className="text-xs text-gray-500">
                                                    {formatCurrency(parseFloat(String(advance.monthly_deduction)))}/mois
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(advance.status)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                {advance.status === 'DRAFT' && (
                                                    <button
                                                        onClick={() => handleSubmitForApproval(advance.id)}
                                                        className="text-primary hover:text-primary/80 text-sm font-medium"
                                                    >
                                                        Soumettre
                                                    </button>
                                                )}
                                                {canApprove && advance.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedAdvance(advance);
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

            {/* Request Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Nouvelle demande d'avance
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Montant ($) *
                                </label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                                    required
                                    min="1"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Raison *
                                </label>
                                <textarea
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                                    rows={3}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Date souhaitée
                                </label>
                                <input
                                    type="date"
                                    value={formData.needed_by_date}
                                    onChange={(e) => setFormData({ ...formData, needed_by_date: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Période de remboursement (mois)
                                </label>
                                <select
                                    value={formData.repayment_months}
                                    onChange={(e) => setFormData({ ...formData, repayment_months: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="1">1 mois</option>
                                    <option value="2">2 mois</option>
                                    <option value="3">3 mois</option>
                                    <option value="4">4 mois</option>
                                    <option value="5">5 mois</option>
                                    <option value="6">6 mois</option>
                                </select>
                            </div>
                            <div className="flex gap-3 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowRequestModal(false)}
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
            {showReviewModal && selectedAdvance && (
                <ReviewModal
                    advance={selectedAdvance}
                    onClose={() => {
                        setShowReviewModal(false);
                        setSelectedAdvance(null);
                    }}
                    onReview={handleReview}
                />
            )}
        </div>
    );
}

// Review Modal Component
function ReviewModal({
    advance,
    onClose,
    onReview,
}: {
    advance: SalaryAdvance;
    onClose: () => void;
    onReview: (status: 'APPROVED' | 'REJECTED', comment: string) => void;
}) {
    const [comment, setComment] = useState('');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Réviser la demande d'avance
                </h3>
                <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Employé</p>
                        <p className="font-medium text-gray-900 dark:text-white">{advance.user?.full_name}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Montant</p>
                        <p className="font-bold text-xl text-gray-900 dark:text-white">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(parseFloat(String(advance.amount)))}
                        </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Raison</p>
                        <p className="text-gray-900 dark:text-white">{advance.reason}</p>
                    </div>
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
