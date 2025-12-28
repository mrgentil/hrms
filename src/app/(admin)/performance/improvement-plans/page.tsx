"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PerformanceService, { ImprovementPlan, ImprovementAction } from "@/services/performance.service";
import { employeesService } from "@/services/employees.service";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  ACTIVE: "Actif",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  ACTIVE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const ACTION_STATUS_COLORS: Record<string, string> = {
  PENDING: "border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800",
  IN_PROGRESS: "border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20",
  COMPLETED: "border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20",
  CANCELLED: "border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20",
};

export default function ImprovementPlansPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"my" | "team">("my");
  const [myPlans, setMyPlans] = useState<ImprovementPlan[]>([]);
  const [teamPlans, setTeamPlans] = useState<ImprovementPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<ImprovementPlan | null>(null);
  const [updatingAction, setUpdatingAction] = useState<number | null>(null);

  // Create Form State
  const [employees, setEmployees] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlan, setNewPlan] = useState({
    employee_id: 0,
    title: "",
    reason: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  });
  const [creating, setCreating] = useState(false);

  const isManager = user?.role === "ROLE_MANAGER" ||
    user?.role === "ROLE_RH" ||
    user?.role === "ROLE_ADMIN" ||
    user?.role === "ROLE_SUPER_ADMIN";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const myRes = await PerformanceService.getMyImprovementPlans();
      setMyPlans(myRes.data || []);

      setMyPlans(myRes.data || []);

      if (isManager) {
        const [teamRes, empRes] = await Promise.all([
          PerformanceService.getTeamImprovementPlans(),
          employeesService.getAllEmployees()
        ]);
        setTeamPlans(teamRes.data || []);
        setEmployees(empRes.filter((e: any) => e.active));
      }
    } catch (error) {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const loadPlanDetails = async (id: number) => {
    try {
      const res = await PerformanceService.getImprovementPlan(id);
      setSelectedPlan(res.data);
    } catch (error) {
      toast.error("Erreur lors du chargement du plan");
    }
  };

  const handleUpdateActionStatus = async (planId: number, actionId: number, newStatus: string) => {
    try {
      setUpdatingAction(actionId);
      await PerformanceService.updateAction(planId, actionId, { status: newStatus as ImprovementAction["status"] });
      toast.success("Statut mis à jour");
      loadPlanDetails(planId);
    } catch (error) {
      toast.error("Erreur");
    } finally {
      setUpdatingAction(null);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.employee_id) {
      toast.error("Veuillez sélectionner un employé");
      return;
    }
    if (!newPlan.title) {
      toast.error("Titre requis");
      return;
    }

    try {
      setCreating(true);
      // Find employee manager id (optional optimization, backend should handle permissions)
      const selectedEmp = employees.find(e => e.id === Number(newPlan.employee_id));

      await PerformanceService.createImprovementPlan({
        ...newPlan,
        employee_id: Number(newPlan.employee_id),
        manager_id: user?.id || 0, // Current user is the manager creating the plan
        status: "ACTIVE"
      });
      toast.success("Plan créé avec succès");
      setShowCreateForm(false);
      setNewPlan({
        employee_id: 0,
        title: "",
        reason: "",
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
      });
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateNotes = async (planId: number, actionId: number, notes: string) => {
    try {
      await PerformanceService.updateAction(planId, actionId, { employee_notes: notes });
      toast.success("Notes enregistrées");
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const getProgressPercent = (plan: ImprovementPlan) => {
    if (!plan.actions || plan.actions.length === 0) return 0;
    const completed = plan.actions.filter(a => a.status === "COMPLETED").length;
    return Math.round((completed / plan.actions.length) * 100);
  };

  const PlanCard = ({ plan, showEmployee = false }: { plan: ImprovementPlan; showEmployee?: boolean }) => {
    const progress = getProgressPercent(plan);
    const isOverdue = plan.end_date && new Date(plan.end_date) < new Date() && plan.status !== "COMPLETED";

    return (
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => loadPlanDetails(plan.id)}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">{plan.title}</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[plan.status]}`}>
                {STATUS_LABELS[plan.status]}
              </span>
            </div>
            {showEmployee && plan.employee && (
              <p className="text-sm text-primary font-medium">{plan.employee.full_name}</p>
            )}
            {plan.reason && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{plan.reason}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
          <span>📅 {formatDate(plan.start_date)} → {formatDate(plan.end_date)}</span>
          <span>📋 {plan.actions?.length || plan._count?.actions || 0} actions</span>
          {isOverdue && <span className="text-red-500 font-medium">⚠️ En retard</span>}
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Progression</span>
            <span className="font-medium text-gray-900 dark:text-white">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${progress >= 100 ? "bg-green-500" : progress >= 50 ? "bg-blue-500" : "bg-yellow-500"
                }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Plans d'Amélioration" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveTab("my"); setSelectedPlan(null); }}
            className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors ${activeTab === "my" ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}
          >
            📈 Mes Plans ({myPlans.length})
          </button>
          {isManager && (
            <button
              onClick={() => { setActiveTab("team"); setSelectedPlan(null); }}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors ${activeTab === "team" ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
            >
              👥 Plans Équipe ({teamPlans.length})
            </button>
          )}
        </div>

        {/* Create Button */}
        {isManager && !selectedPlan && (
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 shadow-sm"
            >
              <span className="text-xl">+</span> Nouveau Plan
            </button>
          </div>
        )}

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nouveau Plan d'Amélioration</h3>
                <button onClick={() => setShowCreateForm(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">✕</button>
              </div>
              <form onSubmit={handleCreatePlan} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employé *</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={newPlan.employee_id}
                    onChange={e => setNewPlan({ ...newPlan, employee_id: Number(e.target.value) })}
                    required
                  >
                    <option value={0}>Sélectionner...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre du plan *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Ex: Amélioration des ventes"
                    value={newPlan.title}
                    onChange={e => setNewPlan({ ...newPlan, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Raison / Objectif</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={3}
                    placeholder="Contexte..."
                    value={newPlan.reason}
                    onChange={e => setNewPlan({ ...newPlan, reason: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date début</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={newPlan.start_date}
                      onChange={e => setNewPlan({ ...newPlan, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date fin</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={newPlan.end_date}
                      onChange={e => setNewPlan({ ...newPlan, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    {creating ? "Création..." : "Créer le plan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Plan Detail Modal */}
        {selectedPlan && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedPlan.title}</h2>
                    <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[selectedPlan.status]}`}>
                      {STATUS_LABELS[selectedPlan.status]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>👤 {selectedPlan.employee?.full_name}</span>
                    <span>👔 Manager: {selectedPlan.manager?.full_name}</span>
                    <span>📅 {formatDate(selectedPlan.start_date)} → {formatDate(selectedPlan.end_date)}</span>
                  </div>
                  {selectedPlan.reason && (
                    <p className="mt-3 text-gray-600 dark:text-gray-300">{selectedPlan.reason}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Actions List */}
            <div className="p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Actions ({selectedPlan.actions?.length || 0})
              </h3>

              {!selectedPlan.actions || selectedPlan.actions.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucune action définie</p>
              ) : (
                <div className="space-y-4">
                  {selectedPlan.actions.map((action, index) => (
                    <div
                      key={action.id}
                      className={`p-4 rounded-lg border-2 transition-colors ${ACTION_STATUS_COLORS[action.status]}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">{action.title}</h4>
                              {action.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{action.description}</p>
                              )}
                              {action.due_date && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                  📅 Échéance: {formatDate(action.due_date)}
                                  {action.completed_at && ` • ✅ Terminé le ${formatDate(action.completed_at)}`}
                                </p>
                              )}
                            </div>

                            {/* Status Update Buttons */}
                            <div className="flex gap-1 flex-shrink-0">
                              {["PENDING", "IN_PROGRESS", "COMPLETED"].map((status) => (
                                <button
                                  key={status}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateActionStatus(selectedPlan.id, action.id, status);
                                  }}
                                  disabled={updatingAction === action.id}
                                  className={`px-2 py-1 text-xs rounded transition-colors ${action.status === status
                                      ? status === "COMPLETED" ? "bg-green-500 text-white" :
                                        status === "IN_PROGRESS" ? "bg-blue-500 text-white" :
                                          "bg-gray-400 text-white"
                                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                                >
                                  {status === "PENDING" && "⏳"}
                                  {status === "IN_PROGRESS" && "🔄"}
                                  {status === "COMPLETED" && "✅"}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="mt-3 grid md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Mes notes
                              </label>
                              <textarea
                                defaultValue={action.employee_notes || ""}
                                onBlur={(e) => {
                                  if (e.target.value !== (action.employee_notes || "")) {
                                    handleUpdateNotes(selectedPlan.id, action.id, e.target.value);
                                  }
                                }}
                                rows={2}
                                className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                                placeholder="Ajouter des notes..."
                              />
                            </div>
                            {action.manager_notes && (
                              <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                  Notes du manager
                                </label>
                                <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-2 rounded">
                                  {action.manager_notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Plans Grid */}
        {!selectedPlan && activeTab === "my" && (
          myPlans.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="text-5xl mb-4">✨</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aucun plan d&apos;amélioration</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Vous n&apos;avez pas de plan d&apos;amélioration actif.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          )
        )}

        {!selectedPlan && activeTab === "team" && isManager && (
          teamPlans.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aucun plan d&apos;équipe</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Vous n&apos;avez pas créé de plan d&apos;amélioration pour votre équipe.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} showEmployee />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
