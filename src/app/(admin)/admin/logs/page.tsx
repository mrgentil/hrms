"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { auditService, AuditLog, AuditStats } from "@/services/audit.service";
import { employeesService } from "@/services/employees.service";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  LOGIN: { label: "Connexion", color: "bg-green-100 text-green-800", icon: "🔓" },
  LOGOUT: { label: "Déconnexion", color: "bg-gray-100 text-gray-800", icon: "🔒" },
  CREATE: { label: "Création", color: "bg-blue-100 text-blue-800", icon: "➕" },
  UPDATE: { label: "Modification", color: "bg-yellow-100 text-yellow-800", icon: "✏️" },
  DELETE: { label: "Suppression", color: "bg-red-100 text-red-800", icon: "🗑️" },
  VIEW: { label: "Consultation", color: "bg-purple-100 text-purple-800", icon: "👁️" },
};

const ENTITY_LABELS: Record<string, string> = {
  user: "Utilisateur",
  auth: "Authentification",
  leave: "Congé",
  attendance: "Pointage",
  department: "Département",
  position: "Poste",
  announcement: "Annonce",
  settings: "Paramètres",
  expense: "Note de frais",
  contract: "Contrat",
  document: "Document",
};

export default function AuditLogsPage() {
  const toast = useToast();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [users, setUsers] = useState<{ id: number; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filtres
  const [filterUser, setFilterUser] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterEntity, setFilterEntity] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const limit = 50;

  useEffect(() => {
    loadData();
    loadStats();
    loadUsers();
  }, []);

  useEffect(() => {
    loadData();
  }, [page, filterUser, filterAction, filterEntity, filterStartDate, filterEndDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await auditService.getLogs({
        user_id: filterUser ? parseInt(filterUser) : undefined,
        action: filterAction || undefined,
        entity_type: filterEntity || undefined,
        start_date: filterStartDate || undefined,
        end_date: filterEndDate || undefined,
        limit,
        offset: page * limit,
      });
      setLogs(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error("Erreur chargement logs:", error);
      toast.error("Erreur lors du chargement des logs");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await auditService.getStats();
      setStats(data);
    } catch (error) {
      console.error("Erreur stats:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await employeesService.getEmployees({ limit: 1000 });
      setUsers((data.data || data).map((u: any) => ({ id: u.id, full_name: u.full_name })));
    } catch (error) {
      console.error("Erreur users:", error);
    }
  };

  const resetFilters = () => {
    setFilterUser("");
    setFilterAction("");
    setFilterEntity("");
    setFilterStartDate("");
    setFilterEndDate("");
    setPage(0);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Logs & Audit" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📝 Logs & Audit</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Historique des actions dans le système
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-gray-500 dark:text-gray-400 text-sm">Total logs</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="text-3xl font-bold text-green-600">{stats.today}</div>
            <div className="text-gray-500 dark:text-gray-400 text-sm">Aujourd'hui</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="text-3xl font-bold text-yellow-600">{stats.thisWeek}</div>
            <div className="text-gray-500 dark:text-gray-400 text-sm">Cette semaine</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="text-3xl font-bold text-purple-600">{stats.thisMonth}</div>
            <div className="text-gray-500 dark:text-gray-400 text-sm">Ce mois</div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <select
            value={filterUser}
            onChange={(e) => { setFilterUser(e.target.value); setPage(0); }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
          >
            <option value="">Tous les utilisateurs</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.full_name}</option>
            ))}
          </select>

          <select
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setPage(0); }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
          >
            <option value="">Toutes les actions</option>
            {Object.entries(ACTION_LABELS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={filterEntity}
            onChange={(e) => { setFilterEntity(e.target.value); setPage(0); }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
          >
            <option value="">Toutes les entités</option>
            {Object.entries(ENTITY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => { setFilterStartDate(e.target.value); setPage(0); }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
            placeholder="Date début"
          />

          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => { setFilterEndDate(e.target.value); setPage(0); }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
            placeholder="Date fin"
          />

          <button
            onClick={resetFilters}
            className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Tableau des logs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Historique ({total} entrées)
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Aucun log trouvé
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Utilisateur</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Entité</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">IP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((log) => {
                    const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: "bg-gray-100 text-gray-800", icon: "📋" };
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {log.user?.full_name || "Système"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${actionInfo.color}`}>
                            {actionInfo.icon} {actionInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {ENTITY_LABELS[log.entity_type] || log.entity_type}
                          {log.entity_id && <span className="text-xs ml-1">#{log.entity_id}</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400 font-mono">
                          {log.ip_address || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {(log.old_values || log.new_values) && (
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="text-primary hover:text-primary/80 text-sm"
                            >
                              Voir détails
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Page {page + 1} sur {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal détails */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedLog(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Détails du log #{selectedLog.id}
              </h3>
              <button onClick={() => setSelectedLog(null)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Date</div>
                  <div className="font-medium">{formatDate(selectedLog.created_at)}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Utilisateur</div>
                  <div className="font-medium">{selectedLog.user?.full_name || "Système"}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Action</div>
                  <div className="font-medium">{ACTION_LABELS[selectedLog.action]?.label || selectedLog.action}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Entité</div>
                  <div className="font-medium">{ENTITY_LABELS[selectedLog.entity_type] || selectedLog.entity_type} {selectedLog.entity_id && `#${selectedLog.entity_id}`}</div>
                </div>
                {selectedLog.ip_address && (
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Adresse IP</div>
                    <div className="font-mono text-xs">{selectedLog.ip_address}</div>
                  </div>
                )}
              </div>

              {selectedLog.old_values && (
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Anciennes valeurs</div>
                  <pre className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && (
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nouvelles valeurs</div>
                  <pre className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.user_agent && (
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User Agent</div>
                  <div className="text-xs text-gray-500 break-all">{selectedLog.user_agent}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
