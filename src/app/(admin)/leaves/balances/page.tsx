"use client";

import React, { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useToast } from "@/hooks/useToast";
import { leavesService } from "@/services/leaves.service";

interface LeaveBalance {
  id: number;
  user_id: number;
  leave_type_id: number;
  year: number;
  days_accrued: number;
  days_used: number;
  days_pending: number;
  days_remaining: number;
  user?: {
    id: number;
    full_name: string;
    work_email?: string;
    department?: { name: string };
  };
  leave_type?: {
    id: number;
    name: string;
    color?: string;
  };
}

export default function LeaveBalancesPage() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const toast = useToast();

  useEffect(() => {
    loadBalances();
  }, [selectedYear]);

  const loadBalances = async () => {
    try {
      setLoading(true);
      const response = await leavesService.getLeaveBalances(selectedYear);
      if (response.success) {
        setBalances(response.data || []);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des soldes");
    } finally {
      setLoading(false);
    }
  };

  const filteredBalances = balances.filter((balance) =>
    balance.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Grouper par employé
  const groupedByEmployee = filteredBalances.reduce((acc, balance) => {
    const key = balance.user_id;
    if (!acc[key]) {
      acc[key] = {
        user: balance.user,
        balances: [],
      };
    }
    acc[key].balances.push(balance);
    return acc;
  }, {} as Record<number, { user: LeaveBalance["user"]; balances: LeaveBalance[] }>);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Soldes de Congés" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Employés</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Object.keys(groupedByEmployee).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Jours acquis</p>
              <p className="text-2xl font-bold text-green-600">
                {balances.reduce((sum, b) => sum + (b.days_accrued || 0), 0).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Jours pris</p>
              <p className="text-2xl font-bold text-orange-600">
                {balances.reduce((sum, b) => sum + (b.days_used || 0), 0).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <span className="text-2xl">⏳</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Restants</p>
              <p className="text-2xl font-bold text-purple-600">
                {balances.reduce((sum, b) => sum + (b.days_remaining || 0), 0).toFixed(1)}
              </p>
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
              placeholder="Rechercher un employé..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des soldes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-500">Chargement...</p>
          </div>
        ) : Object.keys(groupedByEmployee).length === 0 ? (
          <div className="p-8 text-center">
            <span className="text-4xl">📋</span>
            <p className="mt-2 text-gray-500">Aucun solde de congés trouvé</p>
            <p className="text-sm text-gray-400 mt-1">
              Les soldes seront créés automatiquement pour chaque employé
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {Object.values(groupedByEmployee).map(({ user, balances: userBalances }) => (
              <div key={user?.id} className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {user?.full_name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user?.full_name || "N/A"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {user?.department?.name || ""}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {userBalances.map((balance) => (
                    <div
                      key={balance.id}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
                    >
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {balance.leave_type?.name || "Type inconnu"}
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {balance.days_remaining?.toFixed(1) || 0}
                        </span>
                        <span className="text-xs text-gray-500">
                          / {balance.days_accrued?.toFixed(1) || 0}
                        </span>
                      </div>
                      {balance.days_pending > 0 && (
                        <p className="text-xs text-orange-500 mt-1">
                          {balance.days_pending} en attente
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
