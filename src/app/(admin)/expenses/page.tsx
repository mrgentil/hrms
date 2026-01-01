"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { useSearchParams, useRouter } from "next/navigation";
import {
  expensesService,
  ExpenseReport,
  ExpenseCategory,
  ExpenseStatus,
  CATEGORY_LABELS,
  STATUS_LABELS,
  CreateExpensePayload,
} from "@/services/expensesService";

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const EXPENSE_APPROVE_PERMISSION = 'expenses.approve';
const USERS_VIEW_PERMISSION = 'users.view';

export default function ExpensesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'my' | 'approvals' | 'all'>('my');
  const [expenses, setExpenses] = useState<ExpenseReport[]>([]); // Mes notes
  const [pendingExpenses, setPendingExpenses] = useState<ExpenseReport[]>([]); // Validations
  const [allExpenses, setAllExpenses] = useState<ExpenseReport[]>([]); // Toutes les notes (admin)
  const [loading, setLoading] = useState(true);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseReport | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [filterStatus, setFilterStatus] = useState<ExpenseStatus | "">("");
  const [uploading, setUploading] = useState(false);

  // Form state
  const [form, setForm] = useState<CreateExpensePayload>({
    title: "",
    description: "",
    amount: 0,
    category: "OTHER",
    expense_date: new Date().toISOString().split("T")[0],
    receipt_url: "",
  });

  // Check permissions
  const canApprove = user?.permissions?.includes(EXPENSE_APPROVE_PERMISSION);
  const canViewAll = user?.permissions?.includes(USERS_VIEW_PERMISSION) || canApprove;

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'approvals' && canApprove) {
      setActiveTab('approvals');
    } else if (tabParam === 'all' && canViewAll) {
      setActiveTab('all');
    }
  }, [searchParams, canApprove, canViewAll]);

  useEffect(() => {
    if (activeTab === 'my') {
      loadMyExpenses();
    } else if (activeTab === 'approvals') {
      loadPendingExpenses();
    } else if (activeTab === 'all') {
      loadAllExpenses();
    }
  }, [activeTab, filterStatus]);

  const loadMyExpenses = async () => {
    try {
      setLoading(true);
      const data = await expensesService.getMyExpenses(filterStatus || undefined);
      setExpenses(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingExpenses = async () => {
    try {
      setLoading(true);
      const data = await expensesService.getPending();
      setPendingExpenses(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des validations");
    } finally {
      setLoading(false);
    }
  };

  const loadAllExpenses = async () => {
    try {
      setLoading(true);
      const data = await expensesService.getAll({ status: filterStatus || undefined });
      setAllExpenses(data);
    } catch (error) {
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const result = await expensesService.uploadReceipt(file);
      setForm({ ...form, receipt_url: result.url });
      toast.success("Justificatif uploadé !");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.amount || !form.category) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    try {
      if (editingExpense) {
        await expensesService.update(editingExpense.id, form);
        toast.success("Note mise à jour !");
      } else {
        await expensesService.create(form);
        toast.success("Note créée !");
      }
      setShowForm(false);
      setEditingExpense(null);
      resetForm();
      loadMyExpenses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const handleEdit = (expense: ExpenseReport) => {
    setEditingExpense(expense);
    setForm({
      title: expense.title,
      description: expense.description || "",
      amount: Number(expense.amount),
      category: expense.category,
      expense_date: expense.expense_date.split("T")[0],
      receipt_url: expense.receipt_url || "",
    });
    setShowForm(true);
  };

  const handleSubmitForApproval = async (id: number) => {
    try {
      await expensesService.submit(id);
      toast.success("Note soumise pour approbation !");
      loadMyExpenses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Annuler cette note de frais ?")) return;
    try {
      await expensesService.cancel(id);
      toast.success("Note annulée");
      loadMyExpenses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette note de frais ?")) return;
    try {
      await expensesService.delete(id);
      toast.success("Note supprimée");
      loadMyExpenses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  // Approval Actions
  const handleApprove = async (id: number) => {
    if (!confirm("Approuver cette note de frais ?")) return;
    try {
      await expensesService.approve(id);
      toast.success("Note approuvée");
      // Reload current view
      if (activeTab === 'approvals') loadPendingExpenses();
      if (activeTab === 'all') loadAllExpenses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRejectModal || !rejectReason) return;
    try {
      await expensesService.reject(showRejectModal, rejectReason);
      toast.success("Note rejetée");
      setShowRejectModal(null);
      setRejectReason("");
      // Reload current view
      if (activeTab === 'approvals') loadPendingExpenses();
      if (activeTab === 'all') loadAllExpenses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  // Mark as paid
  const handleMarkAsPaid = async (id: number) => {
    if (!confirm("Marquer cette note comme payée ?")) return;
    try {
      await expensesService.markAsPaid(id);
      toast.success("Note marquée comme payée");
      loadAllExpenses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      amount: 0,
      category: "OTHER",
      expense_date: new Date().toISOString().split("T")[0],
      receipt_url: "",
    });
  };

  const getStatusBadge = (status: ExpenseStatus) => {
    const { label, color } = STATUS_LABELS[status];
    const colors: Record<string, string> = {
      gray: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[color]}`}>
        {label}
      </span>
    );
  };

  const stats = {
    total: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
    draft: expenses.filter(e => e.status === "DRAFT").length,
    pending: expenses.filter(e => e.status === "PENDING").length,
    approved: expenses.filter(e => e.status === "APPROVED").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notes de Frais</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {activeTab === 'my' ? 'Gérez vos demandes de remboursement' : 'Gestion globale des notes de frais'}
          </p>
        </div>

        {activeTab === 'my' && (
          <button
            onClick={() => { setShowForm(true); setEditingExpense(null); resetForm(); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon />
            Nouvelle Note
          </button>
        )}
      </div>

      {/* TABS */}
      {(canApprove || canViewAll) && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('my')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'my'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              Mes Notes
            </button>
            {canApprove && (
              <button
                onClick={() => setActiveTab('approvals')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'approvals'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
              >
                Validations
                {pendingExpenses.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                    {pendingExpenses.length}
                  </span>
                )}
              </button>
            )}
            {canViewAll && (
              <button
                onClick={() => setActiveTab('all')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'all'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
              >
                Historique Global
              </button>
            )}
          </nav>
        </div>
      )}

      {/* MY EXPENSES STATS & FILTER (Only for 'my' tab) */}
      {activeTab === 'my' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total.toFixed(2)} $
              </div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            {/* ... other stats ... */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
              <div className="text-sm text-gray-500">Brouillons</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-500">En attente</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <div className="text-sm text-gray-500">Approuvées</div>
            </div>
          </div>
        </>
      )}

      {/* FILTER for ALL tabs */}
      <div className="flex gap-2">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ExpenseStatus | "")}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="flex items-center justify-center h-48 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          {/* === MY EXPENSES TABLE === */}
          {activeTab === 'my' && (
            <div className="overflow-x-auto">
              {expenses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">Aucune note de frais</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Titre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Catégorie</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Montant</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Statut</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(expense.expense_date).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{expense.title}</div>
                          {expense.description && <div className="text-xs text-gray-500 truncate max-w-xs">{expense.description}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="flex items-center gap-1">
                            {CATEGORY_LABELS[expense.category]?.icon}
                            {CATEGORY_LABELS[expense.category]?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                          {Number(expense.amount).toFixed(2)} {expense.currency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusBadge(expense.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                          {expense.status === "DRAFT" && (
                            <>
                              <button onClick={() => handleEdit(expense)} className="text-blue-600 hover:text-blue-800">Modifier</button>
                              <button onClick={() => handleSubmitForApproval(expense.id)} className="text-green-600 hover:text-green-800">Soumettre</button>
                              <button onClick={() => handleDelete(expense.id)} className="text-red-600 hover:text-red-800">Supprimer</button>
                            </>
                          )}
                          {expense.status === "PENDING" && (
                            <button onClick={() => handleCancel(expense.id)} className="text-red-600 hover:text-red-800">Annuler</button>
                          )}
                          {expense.receipt_url && (
                            <a href={`${process.env.NEXT_PUBLIC_API_URL}${expense.receipt_url}`} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-800">📎</a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* === APPROVALS TABLE === */}
          {activeTab === 'approvals' && (
            <div className="overflow-x-auto">
              {pendingExpenses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">Aucune demande en attente</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Employé</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Détails</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Montant</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {pendingExpenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {expense.user?.full_name || "Inconnu"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {expense.user?.department?.name || "Département inconnu"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(expense.expense_date).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{expense.title}</div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            {CATEGORY_LABELS[expense.category]?.icon} {CATEGORY_LABELS[expense.category]?.label}
                          </div>
                          {expense.receipt_url && (
                            <a href={`${process.env.NEXT_PUBLIC_API_URL}${expense.receipt_url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 mt-1">
                              📎 Voir le justificatif
                            </a>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                          {Number(expense.amount).toFixed(2)} {expense.currency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                          <button onClick={() => handleApprove(expense.id)} className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 font-medium">
                            Approuver
                          </button>
                          <button onClick={() => setShowRejectModal(expense.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 font-medium">
                            Rejeter
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* === ALL EXPENSES TABLE === */}
          {activeTab === 'all' && (
            <div className="overflow-x-auto">
              {allExpenses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">Aucune note de frais trouvée</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Employé</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Détails</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Montant</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Statut</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {allExpenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {expense.user?.full_name || "Inconnu"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {expense.user?.department?.name || "Département inconnu"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(expense.expense_date).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{expense.title}</div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            {CATEGORY_LABELS[expense.category]?.icon} {CATEGORY_LABELS[expense.category]?.label}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                          {Number(expense.amount).toFixed(2)} {expense.currency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusBadge(expense.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                          {/* Quick actions for pending in 'all' view too */}
                          {expense.status === 'PENDING' && canApprove && (
                            <>
                              <button onClick={() => handleApprove(expense.id)} className="text-green-600 hover:text-green-800">✓ Valider</button>
                              <button onClick={() => setShowRejectModal(expense.id)} className="text-red-600 hover:text-red-800">✗ Rejeter</button>
                            </>
                          )}
                          {expense.status === 'APPROVED' && expense.payment_date === null && canViewAll && (
                            <button onClick={() => handleMarkAsPaid(expense.id)} className="text-blue-600 hover:text-blue-800">Marquer payée</button>
                          )}
                          {expense.receipt_url && (
                            <a href={`${process.env.NEXT_PUBLIC_API_URL}${expense.receipt_url}`} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-800">📎</a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {editingExpense ? "Modifier la note" : "Nouvelle note de frais"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* FORM CONTENT */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Titre *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Montant *</label>
                  <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Date *</label>
                  <input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Catégorie *</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                  {Object.entries(CATEGORY_LABELS).map(([value, { label, icon }]) => (
                    <option key={value} value={value}>{icon} {label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Description</label>
                <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Justificatif</label>
                <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileUpload} className="hidden" />
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {uploading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div> : <UploadIcon />}
                    {form.receipt_url ? "Changer" : "Ajouter"}
                  </button>
                  {form.receipt_url && <span className="text-sm text-green-600">✓ Fichier ajouté</span>}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => { setShowForm(false); setEditingExpense(null); }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingExpense ? "Mettre à jour" : "Créer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Motif du rejet</h3>
            <form onSubmit={handleRejectSubmit}>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Pourquoi rejetez-vous cette note ?"
                required
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setShowRejectModal(null); setRejectReason(""); }} className="px-3 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Annuler</button>
                <button type="submit" className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Rejeter</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
