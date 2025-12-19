"use client";

import React, { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { fundRequestService } from "@/services/payroll.service";
import { useToast } from "@/hooks/useToast";
import { useUserRole, hasPermission } from "@/hooks/useUserRole";
import type { FundRequest, FundRequestStatus } from "@/types/payroll.types";

export default function FundRequestsPage() {
    const toast = useToast();
    const { role: userRole } = useUserRole();

    const [requests, setRequests] = useState<FundRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<FundRequest | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showPayModal, setShowPayModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        amount: '',
        reason: '',
        project: '',
        department: '',
        needed_by: '',
    });

    // Permission checks
    const canViewAll = !!userRole && hasPermission(userRole, 'payroll.fund_requests');
    const canApprove = !!userRole && hasPermission(userRole, 'payroll.fund_requests');

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const response = canViewAll
                ? await fundRequestService.getRequests({})
                : await fundRequestService.getMyRequests();

            setRequests(canViewAll && 'data' in response ? response.data : response.data);
        } catch (error) {
            console.error('Erreur chargement demandes de fonds:', error);
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
            await fundRequestService.createRequest({
                amount: parseFloat(formData.amount),
                reason: formData.reason,
                project: formData.project || undefined,
                department: formData.department || undefined,
                needed_by: formData.needed_by || undefined,
            });

            toast.success('Demande de fonds créée avec succès');
            setShowRequestModal(false);
            setFormData({ amount: '', reason: '', project: '', department: '', needed_by: '' });
            loadRequests();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors de la création');
        }
    };

    const handleSubmitForApproval = async (id: number) => {
        try {
            await fundRequestService.submitRequest(id);
            toast.success('Demande soumise pour approbation');
            loadRequests();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors de la soumission');
        }
    };

    const handleReview = async (status: 'APPROVED' | 'REJECTED', comment: string) => {
        if (!selectedRequest) return;

        try {
            await fundRequestService.reviewRequest(selectedRequest.id, { status, reviewer_comment: comment });
            toast.success(`Demande ${status === 'APPROVED' ? 'approuvée' : 'rejetée'}`);
            setShowReviewModal(false);
            setSelectedRequest(null);
            loadRequests();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors de la révision');
        }
    };

    const handleMarkAsPaid = async (paymentMethod: string, paymentRef: string) => {
        if (!selectedRequest) return;

        try {
            await fundRequestService.markAsPaid(selectedRequest.id, {
                payment_method: paymentMethod,
                payment_ref: paymentRef
            });
            toast.success('Demande marquée comme payée');
            setShowPayModal(false);
            setSelectedRequest(null);
            loadRequests();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors du paiement');
        }
    };

    const getStatusBadge = (status: FundRequestStatus) => {
        const badges: Record<FundRequestStatus, { color: string; label: string }> = {
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
            currency: 'USD',
        }).format(amount);
    };

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('fr-FR');
    };

    // Calculate statistics
    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'PENDING').length,
        approved: requests.filter(r => r.status === 'APPROVED' || r.status === 'PAID').length,
        totalAmount: requests.reduce((sum, r) => sum + parseFloat(String(r.amount)), 0),
    };

    return (
        <div className="space-y-6">
            <PageBreadcrumb pageTitle="Demandes de Fonds" />

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
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

            {/* Requests List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-gray-500">Chargement...</p>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="p-8 text-center">
                        <span className="text-4xl">💰</span>
                        <p className="mt-2 text-gray-500">Aucune demande de fonds trouvée</p>
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
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Projet</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date demandée</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {requests.map((request) => (
                                    <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        {canViewAll && (
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{request.user?.full_name}</p>
                                                    <p className="text-sm text-gray-500">{request.user?.department_user_department_idTodepartment?.department_name}</p>
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(parseFloat(String(request.amount)))}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                            {request.reason.substring(0, 50)}{request.reason.length > 50 ? '...' : ''}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                            {request.project || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                            {formatDate(request.created_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(request.status)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                {request.status === 'DRAFT' && (
                                                    <button
                                                        onClick={() => handleSubmitForApproval(request.id)}
                                                        className="text-primary hover:text-primary/80 text-sm font-medium"
                                                    >
                                                        Soumettre
                                                    </button>
                                                )}
                                                {canApprove && request.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRequest(request);
                                                            setShowReviewModal(true);
                                                        }}
                                                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                                                    >
                                                        Réviser
                                                    </button>
                                                )}
                                                {canApprove && request.status === 'APPROVED' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRequest(request);
                                                            setShowPayModal(true);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                    >
                                                        Marquer payé
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
                            Nouvelle demande de fonds
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
                                    Raison / Description *
                                </label>
                                <textarea
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                                    rows={3}
                                    required
                                    placeholder="Ex: Paiement des prestataires pour la campagne marketing Q1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Projet / Campagne
                                </label>
                                <input
                                    type="text"
                                    value={formData.project}
                                    onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                                    placeholder="Ex: Campagne Marketing Q1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Département
                                </label>
                                <input
                                    type="text"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                                    placeholder="Ex: Marketing"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Date limite de besoin
                                </label>
                                <input
                                    type="date"
                                    value={formData.needed_by}
                                    onChange={(e) => setFormData({ ...formData, needed_by: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                                />
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
            {showReviewModal && selectedRequest && (
                <ReviewModal
                    request={selectedRequest}
                    onClose={() => {
                        setShowReviewModal(false);
                        setSelectedRequest(null);
                    }}
                    onReview={handleReview}
                />
            )}

            {/* Pay Modal */}
            {showPayModal && selectedRequest && (
                <PayModal
                    request={selectedRequest}
                    onClose={() => {
                        setShowPayModal(false);
                        setSelectedRequest(null);
                    }}
                    onPay={handleMarkAsPaid}
                />
            )}
        </div>
    );
}

// Review Modal Component
function ReviewModal({
    request,
    onClose,
    onReview,
}: {
    request: FundRequest;
    onClose: () => void;
    onReview: (status: 'APPROVED' | 'REJECTED', comment: string) => void;
}) {
    const [comment, setComment] = useState('');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Réviser la demande de fonds
                </h3>
                <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Employé</p>
                        <p className="font-medium text-gray-900 dark:text-white">{request.user?.full_name}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Montant</p>
                        <p className="font-bold text-xl text-gray-900 dark:text-white">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(parseFloat(String(request.amount)))}
                        </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Raison</p>
                        <p className="text-gray-900 dark:text-white">{request.reason}</p>
                    </div>
                    {request.project && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Projet</p>
                            <p className="text-gray-900 dark:text-white">{request.project}</p>
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

// Pay Modal Component
function PayModal({
    request,
    onClose,
    onPay,
}: {
    request: FundRequest;
    onClose: () => void;
    onPay: (paymentMethod: string, paymentRef: string) => void;
}) {
    const [paymentMethod, setPaymentMethod] = useState('Virement');
    const [paymentRef, setPaymentRef] = useState('');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Marquer comme payé
                </h3>
                <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
                        <p className="text-sm text-green-600 dark:text-green-400">Montant à payer</p>
                        <p className="font-bold text-xl text-green-900 dark:text-green-100">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(parseFloat(String(request.amount)))}
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Méthode de paiement
                        </label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                        >
                            <option value="Virement">Virement bancaire</option>
                            <option value="Chèque">Chèque</option>
                            <option value="Espèces">Espèces</option>
                            <option value="Carte">Carte bancaire</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Référence de paiement
                        </label>
                        <input
                            type="text"
                            value={paymentRef}
                            onChange={(e) => setPaymentRef(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                            placeholder="Ex: VIR-2024-001"
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
                            onClick={() => onPay(paymentMethod, paymentRef)}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Confirmer le paiement
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
