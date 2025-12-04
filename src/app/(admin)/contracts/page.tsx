"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useToast } from "@/hooks/useToast";
import {
  contractsService,
  Contract,
  ContractType,
  ContractStatus,
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
} from "@/services/contracts.service";

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    status?: ContractStatus;
    type?: ContractType;
  }>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadContracts();
  }, [filter]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const data = await contractsService.getAll({
        status: filter.status,
        contract_type: filter.type,
      });
      setContracts(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des contrats");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const formatSalary = (salary?: number, currency = "EUR") => {
    if (!salary) return "-";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    }).format(salary);
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Gestion des Contrats" />

      {/* Header avec stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <span className="text-2xl">📄</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {contracts.length}
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Actifs</p>
              <p className="text-2xl font-bold text-green-600">
                {contracts.filter((c) => c.status === ContractStatus.ACTIVE).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <span className="text-2xl">⏰</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Expirent bientôt
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {
                  contracts.filter((c) => {
                    if (!c.end_date || c.status !== ContractStatus.ACTIVE) return false;
                    const endDate = new Date(c.end_date);
                    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    return endDate <= in30Days;
                  }).length
                }
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <span className="text-2xl">📝</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">CDI</p>
              <p className="text-2xl font-bold text-purple-600">
                {contracts.filter((c) => c.contract_type === ContractType.CDI).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <select
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
              value={filter.status || ""}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  status: e.target.value as ContractStatus || undefined,
                })
              }
            >
              <option value="">Tous les statuts</option>
              {Object.entries(CONTRACT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
              value={filter.type || ""}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  type: e.target.value as ContractType || undefined,
                })
              }
            >
              <option value="">Tous les types</option>
              {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <Link
            href="/contracts/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau contrat
          </Link>
        </div>
      </div>

      {/* Liste des contrats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-500">Chargement...</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="p-8 text-center">
            <span className="text-4xl">📄</span>
            <p className="mt-2 text-gray-500">Aucun contrat trouvé</p>
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
                    Salaire
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {contracts.map((contract) => (
                  <tr
                    key={contract.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                          {contract.user?.full_name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {contract.user?.full_name || "N/A"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {contract.user?.position?.title || ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                        {CONTRACT_TYPE_LABELS[contract.contract_type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(contract.start_date)}
                      {contract.end_date && (
                        <>
                          <span className="mx-1">→</span>
                          {formatDate(contract.end_date)}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {formatSalary(contract.salary, contract.salary_currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          CONTRACT_STATUS_COLORS[contract.status]
                        }`}
                      >
                        {CONTRACT_STATUS_LABELS[contract.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/contracts/${contract.id}`}
                        className="text-primary hover:text-primary/80"
                      >
                        Voir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
