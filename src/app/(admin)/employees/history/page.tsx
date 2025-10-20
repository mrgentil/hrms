'use client';

import { useEffect, useMemo, useState } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import { employeesService } from '@/services/employees.service';
import { useToast } from '@/hooks/useToast';

type EmploymentHistory = {
  id: number;
  change_type: string;
  effective_date: string;
  notes?: string | null;
  created_at: string;
};

type FilterState = {
  search: string;
  period: 'all' | '12-months' | '36-months';
};

const defaultFilters: FilterState = {
  search: '',
  period: 'all',
};

const formatDate = (value: string) => new Date(value).toLocaleDateString('fr-FR');

export default function EmployeeHistoryPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<EmploymentHistory[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await employeesService.getMyEmploymentHistory();
        if (!response?.success) {
          throw new Error(response?.message || 'Impossible de récupérer votre historique.');
        }
        setHistory(response.data || []);
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Erreur lors de la récupération de votre historique.';
        toast.error(message);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [toast]);

  const filteredHistory = useMemo(() => {
    const searchValue = filters.search.trim().toLowerCase();
    const now = Date.now();
    const cutoff =
      filters.period === '12-months'
        ? now - 365 * 24 * 60 * 60 * 1000
        : filters.period === '36-months'
        ? now - 3 * 365 * 24 * 60 * 60 * 1000
        : null;

    return history.filter((item) => {
      const effectiveDate = new Date(item.effective_date).getTime();
      if (cutoff && effectiveDate < cutoff) {
        return false;
      }

      if (searchValue.length > 0) {
        const haystack = [item.change_type, item.notes]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(searchValue)) {
          return false;
        }
      }

      return true;
    });
  }, [history, filters]);

  const stats = useMemo(() => {
    const total = history.length;
    const lastChange = history[0]?.effective_date;
    const promotions = history.filter((item) =>
      item.change_type.toLowerCase().includes('promotion'),
    ).length;
    const departmentChanges = history.filter((item) =>
      item.change_type.toLowerCase().includes('departement') ||
      item.change_type.toLowerCase().includes('département'),
    ).length;

    return {
      total,
      lastChange,
      promotions,
      departmentChanges,
    };
  }, [history]);

  const handleFilterChange = (partial: Partial<FilterState>) => {
    setFilters((previous) => ({
      ...previous,
      ...partial,
    }));
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Mon historique" />

      <div className="space-y-6">
        <ComponentCard title="Résumé">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border border-transparent bg-primary/10 px-4 py-3 text-primary">
              <div className="text-sm">Événements suivis</div>
              <div className="text-2xl font-semibold">{stats.total}</div>
            </div>
            <div className="rounded-lg border border-transparent bg-success/10 px-4 py-3 text-success">
              <div className="text-sm">Promotions</div>
              <div className="text-2xl font-semibold">{stats.promotions}</div>
            </div>
            <div className="rounded-lg border border-transparent bg-warning/10 px-4 py-3 text-warning">
              <div className="text-sm">Changements de département</div>
              <div className="text-2xl font-semibold">{stats.departmentChanges}</div>
            </div>
            <div className="rounded-lg border border-transparent bg-slate-100 px-4 py-3 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <div className="text-sm">Dernière modification</div>
              <div className="text-2xl font-semibold">
                {stats.lastChange ? formatDate(stats.lastChange) : 'Aucune'}
              </div>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Filtres">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Rechercher
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(event) => handleFilterChange({ search: event.target.value })}
                placeholder="Promotion, mutation, remarque..."
                className="w-full rounded border border-stroke px-3 py-2 text-sm outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Période
              </label>
              <select
                value={filters.period}
                onChange={(event) =>
                  handleFilterChange({
                    period: event.target.value as FilterState['period'],
                  })
                }
                className="w-full rounded border border-stroke px-3 py-2 text-sm outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              >
                <option value="all">Toute la carrière</option>
                <option value="12-months">12 derniers mois</option>
                <option value="36-months">3 dernières années</option>
              </select>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title={`Historique (${filteredHistory.length})`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-primary"></div>
                <p className="text-gray-600 dark:text-gray-400">Chargement de l'historique...</p>
              </div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-gray-600 dark:text-gray-400">
              <div className="mx-auto mb-4 text-5xl">🗂️</div>
              <p>Aucun événement enregistré pour les filtres sélectionnés.</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 h-full w-px bg-gray-200 dark:bg-gray-700 md:left-1/2" />
              <div className="space-y-6">
                {filteredHistory.map((event, index) => {
                  const isRight = index % 2 === 0;
                  return (
                    <div
                      key={event.id}
                      className={`relative md:flex md:items-center ${
                        isRight ? 'md:justify-start' : 'md:justify-end'
                      }`}
                    >
                      <div
                        className={`md:w-1/2 md:px-6 ${isRight ? 'md:text-right' : 'md:text-left'}`}
                      >
                        <div className="rounded-lg border border-stroke bg-white p-4 shadow-sm dark:border-strokedark dark:bg-boxdark">
                          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            <span>{formatDate(event.effective_date)}</span>
                            <span>Enregistré le {formatDate(event.created_at)}</span>
                          </div>
                          <h3 className="mt-2 text-lg font-semibold text-black dark:text-white">
                            {event.change_type}
                          </h3>
                          {event.notes && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                              {event.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="absolute left-4 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-white text-primary dark:bg-boxdark md:left-1/2 md:-translate-x-1/2">
                        ●
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ComponentCard>
      </div>
    </div>
  );
}
