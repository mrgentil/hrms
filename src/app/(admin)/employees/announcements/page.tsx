'use client';

import { useEffect, useMemo, useState } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import { employeesService } from '@/services/employees.service';
import { useToast } from '@/hooks/useToast';

type Announcement = {
  id: number;
  announcement_title: string;
  announcement_description?: string | null;
  created_at: string;
  department?: {
    id: number;
    department_name: string;
  } | null;
  user?: {
    id: number;
    full_name: string;
  } | null;
};

type FilterState = {
  search: string;
  scope: 'all' | 'department' | 'global';
};

const defaultFilters: FilterState = {
  search: '',
  scope: 'all',
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

export default function EmployeeAnnouncementsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const response = await employeesService.getMyAnnouncements();
        if (!response?.success) {
          throw new Error(response?.message || 'Impossible de récupérer les annonces.');
        }
        setAnnouncements(response.data || []);
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Erreur lors de la récupération des annonces.';
        toast.error(message);
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [toast]);

  const filteredAnnouncements = useMemo(() => {
    const searchValue = filters.search.trim().toLowerCase();

    return announcements.filter((announcement) => {
      if (filters.scope === 'department' && !announcement.department) {
        return false;
      }

      if (filters.scope === 'global' && announcement.department) {
        return false;
      }

      if (searchValue.length > 0) {
        const haystack = [
          announcement.announcement_title,
          announcement.announcement_description,
          announcement.department?.department_name,
          announcement.user?.full_name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!haystack.includes(searchValue)) {
          return false;
        }
      }

      return true;
    });
  }, [announcements, filters]);

  const stats = useMemo(() => {
    const total = announcements.length;
    const departmentAnnouncements = announcements.filter((item) => item.department).length;
    const globalAnnouncements = total - departmentAnnouncements;
    const latest = announcements[0]?.created_at;

    return {
      total,
      departmentAnnouncements,
      globalAnnouncements,
      latest,
    };
  }, [announcements]);

  const handleFilterChange = (partial: Partial<FilterState>) => {
    setFilters((previous) => ({
      ...previous,
      ...partial,
    }));
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Mes annonces" />

      <div className="space-y-6">
        <ComponentCard title="Résumé">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border border-transparent bg-primary/10 px-4 py-3 text-primary">
              <div className="text-sm">Total</div>
              <div className="text-2xl font-semibold">{stats.total}</div>
            </div>
            <div className="rounded-lg border border-transparent bg-success/10 px-4 py-3 text-success">
              <div className="text-sm">Spécifiques à mon département</div>
              <div className="text-2xl font-semibold">{stats.departmentAnnouncements}</div>
            </div>
            <div className="rounded-lg border border-transparent bg-warning/10 px-4 py-3 text-warning">
              <div className="text-sm">Communiqués généraux</div>
              <div className="text-2xl font-semibold">{stats.globalAnnouncements}</div>
            </div>
            <div className="rounded-lg border border-transparent bg-slate-100 px-4 py-3 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <div className="text-sm">Dernière annonce</div>
              <div className="text-2xl font-semibold">
                {stats.latest ? formatDateTime(stats.latest) : 'Aucune'}
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
                placeholder="Titre, auteur, département..."
                className="w-full rounded border border-stroke px-3 py-2 text-sm outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Portée
              </label>
              <select
                value={filters.scope}
                onChange={(event) =>
                  handleFilterChange({
                    scope: event.target.value as FilterState['scope'],
                  })
                }
                className="w-full rounded border border-stroke px-3 py-2 text-sm outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              >
                <option value="all">Toutes</option>
                <option value="department">Mon département</option>
                <option value="global">Communiqués généraux</option>
              </select>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title={`Annonces (${filteredAnnouncements.length})`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-primary"></div>
                <p className="text-gray-600 dark:text-gray-400">Chargement des annonces...</p>
              </div>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="py-12 text-center text-gray-600 dark:text-gray-400">
              <div className="mx-auto mb-4 text-5xl">📰</div>
              <p>Aucune annonce ne correspond aux filtres sélectionnés.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="rounded-lg border border-stroke bg-white p-4 transition-shadow hover:shadow-md dark:border-strokedark dark:bg-boxdark"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-black dark:text-white">
                        {announcement.announcement_title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-primary">
                          {announcement.department?.department_name || 'Annonce générale'}
                        </span>
                        {announcement.user?.full_name && (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            Par {announcement.user.full_name}
                          </span>
                        )}
                      </div>
                      {announcement.announcement_description && (
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                          {announcement.announcement_description}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-sm text-gray-500 dark:text-gray-400">
                      Publié le{' '}
                      <span className="font-medium text-black dark:text-white">
                        {formatDateTime(announcement.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ComponentCard>
      </div>
    </div>
  );
}
