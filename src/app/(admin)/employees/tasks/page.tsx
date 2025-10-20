'use client';

import { useEffect, useMemo, useState } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import { employeesService, Task } from '@/services/employees.service';
import { useToast } from '@/hooks/useToast';

type FilterState = {
  search: string;
  status: 'all' | Task['status'];
  priority: 'all' | Task['priority'];
  showOverdueOnly: boolean;
};

const DEFAULT_FILTERS: FilterState = {
  search: '',
  status: 'all',
  priority: 'all',
  showOverdueOnly: false,
};

const STATUS_LABELS: Record<Task['status'], string> = {
  TODO: 'A faire',
  IN_PROGRESS: 'En cours',
  BLOCKED: 'Bloquee',
  DONE: 'Terminee',
  ARCHIVED: 'Archivee',
};

const STATUS_COLORS: Record<Task['status'], string> = {
  TODO: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  IN_PROGRESS: 'bg-primary/10 text-primary',
  BLOCKED: 'bg-warning/10 text-warning',
  DONE: 'bg-success/10 text-success',
  ARCHIVED: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

const PRIORITY_LABELS: Record<Task['priority'], string> = {
  LOW: 'Basse',
  MEDIUM: 'Normale',
  HIGH: 'Elevee',
  CRITICAL: 'Critique',
};

const PRIORITY_COLORS: Record<Task['priority'], string> = {
  LOW: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  MEDIUM: 'bg-primary/10 text-primary',
  HIGH: 'bg-warning/10 text-warning',
  CRITICAL: 'bg-danger/10 text-danger',
};

const STATUS_OPTIONS: Task['status'][] = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'ARCHIVED'];

const formatDate = (value?: string | null, fallback = 'Non renseignee') => {
  if (!value) {
    return fallback;
  }
  return new Date(value).toLocaleDateString('fr-FR');
};

const calculateProgress = (status: Task['status']) => {
  switch (status) {
    case 'TODO':
      return 0;
    case 'IN_PROGRESS':
      return 50;
    case 'BLOCKED':
      return 25;
    case 'DONE':
    case 'ARCHIVED':
      return 100;
    default:
      return 0;
  }
};

const isOverdue = (task: Task) => {
  if (!task.due_date || task.status === 'DONE' || task.status === 'ARCHIVED') {
    return false;
  }
  return new Date(task.due_date).getTime() < Date.now();
};

export default function EmployeeTasksPage() {
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await employeesService.getMyTasks();
        if (!response?.success) {
          throw new Error(response?.message || 'Impossible de recuperer les taches.');
        }
        setTasks(response.data || []);
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Erreur lors de la recuperation des taches.';
        toast.error(message);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [toast]);

  const filteredTasks = useMemo(() => {
    const searchValue = filters.search.trim().toLowerCase();

    return tasks.filter((task) => {
      if (filters.status !== 'all' && task.status !== filters.status) {
        return false;
      }

      if (filters.priority !== 'all' && task.priority !== filters.priority) {
        return false;
      }

      if (filters.showOverdueOnly && !isOverdue(task)) {
        return false;
      }

      if (searchValue.length > 0) {
        const haystack = [
          task.title,
          task.description,
          task.project?.name,
          task.task_column?.name,
          task.user_task_created_by_user_idTouser?.full_name,
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
  }, [tasks, filters]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === 'DONE' || task.status === 'ARCHIVED').length;
    const inProgress = tasks.filter((task) => task.status === 'IN_PROGRESS').length;
    const blocked = tasks.filter((task) => task.status === 'BLOCKED').length;
    const overdue = tasks.filter(isOverdue).length;

    return {
      total,
      completed,
      inProgress,
      blocked,
      overdue,
    };
  }, [tasks]);

  const handleFilterChange = (partial: Partial<FilterState>) => {
    setFilters((previous) => ({
      ...previous,
      ...partial,
    }));
  };

  const handleStatusChange = async (task: Task, nextStatus: Task['status']) => {
    if (task.status === nextStatus) {
      return;
    }

    try {
      setUpdatingTaskId(task.id);
      const response = await employeesService.updateMyTask(task.id, {
        status: nextStatus,
      });

      if (!response?.success) {
        throw new Error(response?.message || 'Impossible de mettre a jour la tache.');
      }

      setTasks((previous) =>
        previous.map((item) => (item.id === task.id ? response.data : item)),
      );
      toast.success('Tache mise a jour avec succes.');
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Erreur lors de la mise a jour de la tache.';
      toast.error(message);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Mes taches" />

      <div className="space-y-6">
        <ComponentCard title="Resume">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="rounded-lg border border-transparent bg-primary/10 px-4 py-3 text-primary">
              <div className="text-sm">Total</div>
              <div className="text-2xl font-semibold">{stats.total}</div>
            </div>
            <div className="rounded-lg border border-transparent bg-success/10 px-4 py-3 text-success">
              <div className="text-sm">Completees</div>
              <div className="text-2xl font-semibold">{stats.completed}</div>
            </div>
            <div className="rounded-lg border border-transparent bg-primary/10 px-4 py-3 text-primary">
              <div className="text-sm">En cours</div>
              <div className="text-2xl font-semibold">{stats.inProgress}</div>
            </div>
            <div className="rounded-lg border border-transparent bg-warning/10 px-4 py-3 text-warning">
              <div className="text-sm">Bloquees</div>
              <div className="text-2xl font-semibold">{stats.blocked}</div>
            </div>
            <div className="rounded-lg border border-transparent bg-danger/10 px-4 py-3 text-danger">
              <div className="text-sm">En retard</div>
              <div className="text-2xl font-semibold">{stats.overdue}</div>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Filtres">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Rechercher
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(event) => handleFilterChange({ search: event.target.value })}
                placeholder="Titre, projet, colonne..."
                className="w-full rounded border border-stroke px-3 py-2 text-sm outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Statut
              </label>
              <select
                value={filters.status}
                onChange={(event) =>
                  handleFilterChange({
                    status: (event.target.value as FilterState['status']) || 'all',
                  })
                }
                className="w-full rounded border border-stroke px-3 py-2 text-sm outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              >
                <option value="all">Tous les statuts</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Priorite
              </label>
              <select
                value={filters.priority}
                onChange={(event) =>
                  handleFilterChange({
                    priority: (event.target.value as FilterState['priority']) || 'all',
                  })
                }
                className="w-full rounded border border-stroke px-3 py-2 text-sm outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              >
                <option value="all">Toutes</option>
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as Task['priority'][]).map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_LABELS[priority]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-5 md:pt-8">
              <input
                id="overdue-only"
                type="checkbox"
                checked={filters.showOverdueOnly}
                onChange={(event) => handleFilterChange({ showOverdueOnly: event.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="overdue-only" className="text-sm font-medium text-gray-600 dark:text-gray-400">
                En retard uniquement
              </label>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title={`Taches (${filteredTasks.length})`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-primary"></div>
                <p className="text-gray-600 dark:text-gray-400">Chargement des taches...</p>
              </div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-gray-600 dark:text-gray-400">
              <div className="mx-auto mb-4 text-5xl">🗒️</div>
              <p>Aucune tache ne correspond aux filtres selectionnes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => {
                const progress = calculateProgress(task.status);
                return (
                  <div
                    key={task.id}
                    className="rounded-lg border border-stroke bg-white p-4 transition-shadow hover:shadow-md dark:border-strokedark dark:bg-boxdark"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-black dark:text-white">{task.title}</h3>
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[task.status]}`}>
                            {STATUS_LABELS[task.status]}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
                            Priorite {PRIORITY_LABELS[task.priority]}
                          </span>
                          {isOverdue(task) && (
                            <span className="inline-flex items-center rounded-full bg-danger/10 px-2 py-1 text-xs font-medium text-danger">
                              En retard
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                            {task.description}
                          </p>
                        )}

                        <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <span className="font-medium text-gray-500 dark:text-gray-400">Projet:</span>{' '}
                            <span className="text-black dark:text-white">{task.project?.name || 'Non renseigne'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500 dark:text-gray-400">Colonne:</span>{' '}
                            <span className="text-black dark:text-white">{task.task_column?.name || 'Non renseignee'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500 dark:text-gray-400">Debut:</span>{' '}
                            <span className="text-black dark:text-white">{formatDate(task.start_date)}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500 dark:text-gray-400">Echeance:</span>{' '}
                            <span className="text-black dark:text-white">{formatDate(task.due_date)}</span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Progression</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex w-full flex-col gap-3 md:w-60">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                            Modifier le statut
                          </label>
                          <select
                            value={task.status}
                            disabled={updatingTaskId === task.id}
                            onChange={(event) => handleStatusChange(task, event.target.value as Task['status'])}
                            className="mt-1 w-full rounded border border-stroke px-3 py-2 text-sm outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-form-strokedark dark:bg-form-input dark:text-white"
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {STATUS_LABELS[status]}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="rounded-lg border border-dashed border-slate-200 p-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-300">Assignee:</span>{' '}
                            <span className="text-black dark:text-white">
                              {task.task_assignment[0]?.role
                                ? `${task.task_assignment[0].role} `
                                : ''}
                              (depuis {formatDate(task.task_assignment[0]?.assigned_at)})
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-300">Cree par:</span>{' '}
                            <span className="text-black dark:text-white">
                              {task.user_task_created_by_user_idTouser?.full_name || 'Inconnu'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-300">Derniere mise a jour:</span>{' '}
                            <span className="text-black dark:text-white">{formatDate(task.updated_at)}</span>
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
