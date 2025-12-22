'use client';

import { useEffect, useMemo, useState } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import { employeesService } from '@/services/employees.service';
import { useToast } from '@/hooks/useToast';

type Announcement = {
  id: number;
  title: string;
  content: string;
  type?: string;
  priority?: string;
  created_at: string;
  publish_date?: string;
  department?: {
    id: number;
    department_name: string;
  } | null;
  author?: {
    id: number;
    full_name: string;
    profile_photo_url?: string | null;
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

// Mappe les types d'annonce vers des libellés et couleurs
const getTypeLabel = (type: string) => {
  const map: Record<string, { label: string; color: string }> = {
    INFO: { label: 'Information', color: 'text-blue-500 bg-blue-100' },
    EVENT: { label: 'Événement', color: 'text-purple-500 bg-purple-100' },
    POLICY: { label: 'Politique', color: 'text-gray-500 bg-gray-100' },
    CELEBRATION: { label: 'Célébration', color: 'text-yellow-500 bg-yellow-100' },
    URGENT: { label: 'Urgent', color: 'text-red-500 bg-red-100' },
    MAINTENANCE: { label: 'Maintenance', color: 'text-orange-500 bg-orange-100' },
  };
  return map[type] || { label: type, color: 'text-gray-500 bg-gray-100' };
};

const getPriorityBadge = (priority: string) => {
  const map: Record<string, { label: string; color: string }> = {
    LOW: { label: 'Basse', color: 'text-gray-500 bg-gray-100' },
    NORMAL: { label: 'Normale', color: 'text-blue-500 bg-blue-100' },
    HIGH: { label: 'Haute', color: 'text-orange-500 bg-orange-100' },
    CRITICAL: { label: 'Critique', color: 'text-red-500 bg-red-100' },
  };
  return map[priority] || { label: priority, color: 'text-gray-500 bg-gray-100' };
};

export default function EmployeeAnnouncementsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        console.log('🔍 [Frontend] Fetching announcements...');
        // Note: employeesService.getMyAnnouncements now returns the main Announcement model
        const response = await employeesService.getMyAnnouncements();
        console.log('✅ [Frontend] Response received:', response);
        // @ts-ignore - Response handling wrapper might vary, adjusting for generic response
        const data = response?.success ? response.data : response;

        if (Array.isArray(data)) {
          console.log(`📊 [Frontend] Got ${data.length} announcements`);
          setAnnouncements(data);
        } else {
          console.error("❌ [Frontend] Unexpected response format:", response);
          setAnnouncements([]);
        }
      } catch (error: any) {
        console.error("❌ [Frontend] Error fetching announcements:", error);
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
      // Filter by scope
      if (filters.scope === 'department' && !announcement.department) {
        return false;
      }
      if (filters.scope === 'global' && announcement.department) {
        return false;
      }

      // Filter by search
      if (searchValue.length > 0) {
        const haystack = [
          announcement.title,
          announcement.content,
          announcement.department?.department_name,
          announcement.author?.full_name,
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
              {filteredAnnouncements.map((announcement) => {
                const typeStyle = getTypeLabel(announcement.type || 'INFO');
                const priorityStyle = getPriorityBadge(announcement.priority || 'NORMAL');

                return (
                  <div
                    key={announcement.id}
                    className="rounded-lg border border-stroke bg-white p-4 transition-shadow hover:shadow-md dark:border-strokedark dark:bg-boxdark"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeStyle.color}`}>
                            {typeStyle.label}
                          </span>
                          {announcement.priority && announcement.priority !== 'NORMAL' && (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityStyle.color}`}>
                              {priorityStyle.label}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">
                            {formatDateTime(announcement.publish_date || announcement.created_at)}
                          </span>
                        </div>

                        <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                          {announcement.title}
                        </h3>

                        <div className="prose prose-sm max-w-none text-gray-600 dark:text-gray-400 whitespace-pre-line mb-3">
                          {announcement.content}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 border-t border-stroke dark:border-strokedark pt-3 mt-1">
                          <div className="flex items-center gap-1.5">
                            {announcement.author?.profile_photo_url ? (
                              <img
                                src={announcement.author.profile_photo_url}
                                alt={announcement.author.full_name}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-medium text-gray-600">
                                {announcement.author?.full_name?.charAt(0) || 'A'}
                              </div>
                            )}
                            <span>Par {announcement.author?.full_name || 'Inconnu'}</span>
                          </div>

                          <span className="text-gray-300">•</span>

                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center rounded-sm bg-primary/5 px-1.5 py-0.5 text-primary">
                              {announcement.department?.department_name || '🏢 Toute l\'entreprise'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ComponentCard>
      </div>
    </div>
  );
}
