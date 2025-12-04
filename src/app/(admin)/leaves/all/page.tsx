"use client";

import React, { useState, useEffect, useMemo } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useToast } from "@/hooks/useToast";
import { leavesService, LeaveRequest } from "@/services/leaves.service";

type FilterStatus = "all" | "Pending" | "Approved" | "Rejected" | "Cancelled";
type FilterPeriod = "all" | "current" | "upcoming" | "past";

export default function AllLeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [periodFilter, setPeriodFilter] = useState<FilterPeriod>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const toast = useToast();

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const response = await leavesService.getAllLeaveRequests();
      if (response.success) {
        setLeaves(response.data || []);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des congés");
    } finally {
      setLoading(false);
    }
  };

  // Extraire les départements uniques
  const departments = useMemo(() => {
    const depts = new Set<string>();
    leaves.forEach((leave) => {
      const dept = (leave.user as any)?.department_user_department_idTodepartment?.department_name;
      if (dept) depts.add(dept);
    });
    return Array.from(depts).sort();
  }, [leaves]);

  // Filtrer les congés
  const filteredLeaves = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return leaves.filter((leave) => {
      // Filtre par recherche
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const name = leave.user?.full_name?.toLowerCase() || "";
        const type = leave.leave_type?.name?.toLowerCase() || "";
        if (!name.includes(search) && !type.includes(search)) {
          return false;
        }
      }

      // Filtre par statut
      if (statusFilter !== "all" && leave.status !== statusFilter) {
        return false;
      }

      // Filtre par période
      if (periodFilter !== "all") {
        const startDate = new Date(leave.start_date);
        const endDate = new Date(leave.end_date);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        switch (periodFilter) {
          case "current":
            // En cours maintenant
            if (!(startDate <= today && endDate >= today && leave.status === "Approved")) {
              return false;
            }
            break;
          case "upcoming":
            // À venir
            if (!(startDate > today && leave.status === "Approved")) {
              return false;
            }
            break;
          case "past":
            // Passé
            if (!(endDate < today)) {
              return false;
            }
            break;
        }
      }

      // Filtre par département
      if (departmentFilter !== "all") {
        const dept = (leave.user as any)?.department_user_department_idTodepartment?.department_name;
        if (dept !== departmentFilter) {
          return false;
        }
      }

      return true;
    });
  }, [leaves, searchTerm, statusFilter, periodFilter, departmentFilter]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentlyOnLeave = leaves.filter((l) => {
      if (l.status !== "Approved") return false;
      const start = new Date(l.start_date);
      const end = new Date(l.end_date);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return start <= today && end >= today;
    });

    const upcoming = leaves.filter((l) => {
      if (l.status !== "Approved") return false;
      const start = new Date(l.start_date);
      return start > today;
    });

    const pending = leaves.filter((l) => l.status === "Pending");

    return {
      currentlyOnLeave: currentlyOnLeave.length,
      upcoming: upcoming.length,
      pending: pending.length,
      total: leaves.length,
    };
  }, [leaves]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${formatDate(start)} → ${formatDate(end)} (${diffDays} jour${diffDays > 1 ? "s" : ""})`;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
      Approved: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
      Rejected: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
      Cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    };
    const labels: Record<string, string> = {
      Pending: "En attente",
      Approved: "Approuvé",
      Rejected: "Refusé",
      Cancelled: "Annulé",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.Pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getLeaveStatus = (leave: LeaveRequest) => {
    if (leave.status !== "Approved") return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (start <= today && end >= today) {
      const daysLeft = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
          🏖️ En congé • Retour dans {daysLeft} jour{daysLeft > 1 ? "s" : ""}
        </span>
      );
    }
    
    if (start > today) {
      const daysUntil = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
          📅 Dans {daysUntil} jour{daysUntil > 1 ? "s" : ""}
        </span>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Gestion des Congés" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div 
          className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer transition-all ${periodFilter === 'current' ? 'ring-2 ring-blue-500' : 'hover:border-blue-300'}`}
          onClick={() => setPeriodFilter(periodFilter === 'current' ? 'all' : 'current')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <span className="text-2xl">🏖️</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">En congé actuellement</p>
              <p className="text-2xl font-bold text-blue-600">{stats.currentlyOnLeave}</p>
            </div>
          </div>
        </div>
        <div 
          className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer transition-all ${periodFilter === 'upcoming' ? 'ring-2 ring-purple-500' : 'hover:border-purple-300'}`}
          onClick={() => setPeriodFilter(periodFilter === 'upcoming' ? 'all' : 'upcoming')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Congés à venir</p>
              <p className="text-2xl font-bold text-purple-600">{stats.upcoming}</p>
            </div>
          </div>
        </div>
        <div 
          className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer transition-all ${statusFilter === 'Pending' ? 'ring-2 ring-yellow-500' : 'hover:border-yellow-300'}`}
          onClick={() => setStatusFilter(statusFilter === 'Pending' ? 'all' : 'Pending')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
              <span className="text-2xl">⏳</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div 
          className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer transition-all ${statusFilter === 'all' && periodFilter === 'all' ? 'ring-2 ring-gray-500' : 'hover:border-gray-300'}`}
          onClick={() => { setStatusFilter('all'); setPeriodFilter('all'); }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total demandes</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">{stats.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Rechercher par nom ou type de congé..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
          >
            <option value="all">Tous les statuts</option>
            <option value="Pending">En attente</option>
            <option value="Approved">Approuvés</option>
            <option value="Rejected">Refusés</option>
            <option value="Cancelled">Annulés</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as FilterPeriod)}
          >
            <option value="all">Toutes les périodes</option>
            <option value="current">En cours maintenant</option>
            <option value="upcoming">À venir</option>
            <option value="past">Passés</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="all">Tous les départements</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          {(statusFilter !== "all" || periodFilter !== "all" || departmentFilter !== "all" || searchTerm) && (
            <button
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => {
                setStatusFilter("all");
                setPeriodFilter("all");
                setDepartmentFilter("all");
                setSearchTerm("");
              }}
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Liste des congés */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-500">Chargement...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="p-8 text-center">
            <span className="text-4xl">📋</span>
            <p className="mt-2 text-gray-500">Aucun congé trouvé</p>
            {(statusFilter !== "all" || periodFilter !== "all" || departmentFilter !== "all" || searchTerm) && (
              <button
                className="mt-2 text-primary hover:underline text-sm"
                onClick={() => {
                  setStatusFilter("all");
                  setPeriodFilter("all");
                  setDepartmentFilter("all");
                  setSearchTerm("");
                }}
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Employé
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Période
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Info
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredLeaves.map((leave) => (
                  <tr
                    key={leave.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                          {leave.user?.full_name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {leave.user?.full_name || "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(leave.user as any)?.department_user_department_idTodepartment?.department_name || ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                        {leave.leave_type?.name || leave.type || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {formatDateRange(leave.start_date, leave.end_date)}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(leave.status)}
                    </td>
                    <td className="px-4 py-3">
                      {getLeaveStatus(leave)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination info */}
        {!loading && filteredLeaves.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-500">
            Affichage de {filteredLeaves.length} congé{filteredLeaves.length > 1 ? "s" : ""}
            {(statusFilter !== "all" || periodFilter !== "all" || departmentFilter !== "all" || searchTerm) && 
              ` (filtré sur ${leaves.length} total)`
            }
          </div>
        )}
      </div>
    </div>
  );
}
