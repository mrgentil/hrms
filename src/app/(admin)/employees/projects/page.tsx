'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import { employeesService } from '@/services/employees.service';
import { useToast } from '@/hooks/useToast';
import { resolveImageUrl } from '@/lib/images';

interface ProjectMember {
  id: number;
  user: {
    id: number;
    full_name: string;
    profile_photo_url?: string;
  };
}

interface ProjectTask {
  id: number;
  status: string;
}

interface MyProject {
  id: number;
  name: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  user?: {
    id: number;
    full_name: string;
    profile_photo_url?: string;
  };
  project_member: ProjectMember[];
  task: ProjectTask[];
  _count: {
    task: number;
    project_member: number;
  };
}

const STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Planifié',
  IN_PROGRESS: 'En cours',
  ON_HOLD: 'En pause',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
};

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  IN_PROGRESS: 'bg-primary/10 text-primary',
  ON_HOLD: 'bg-warning/10 text-warning',
  COMPLETED: 'bg-success/10 text-success',
  CANCELLED: 'bg-danger/10 text-danger',
};

const formatDate = (value?: string | null, fallback = '-') => {
  if (!value) return fallback;
  return new Date(value).toLocaleDateString('fr-FR');
};

export default function EmployeeProjectsPage() {
  const toast = useToast();
  const [projects, setProjects] = useState<MyProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await employeesService.getMyProjects();
        if (!response?.success) {
          throw new Error(response?.message || 'Impossible de récupérer les projets.');
        }
        setProjects(response.data || []);
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Erreur lors de la récupération des projets.';
        toast.error(message);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [toast]);

  const calculateProgress = (tasks: ProjectTask[]) => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'DONE' || t.status === 'ARCHIVED').length;
    return Math.round((completed / tasks.length) * 100);
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Mes Projets" />

      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📂</span>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total projets</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{projects.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚀</span>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">En cours</p>
                <p className="text-2xl font-bold text-primary">
                  {projects.filter(p => p.status === 'IN_PROGRESS').length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✅</span>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Terminés</p>
                <p className="text-2xl font-bold text-success">
                  {projects.filter(p => p.status === 'COMPLETED').length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📋</span>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total tâches</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {projects.reduce((acc, p) => acc + p._count.task, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des projets */}
        <ComponentCard title={`Projets (${projects.length})`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-primary"></div>
                <p className="text-gray-600 dark:text-gray-400">Chargement des projets...</p>
              </div>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-12 text-center text-gray-600 dark:text-gray-400">
              <div className="mx-auto mb-4 text-5xl">📂</div>
              <p>Vous n'êtes membre d'aucun projet pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => {
                const progress = calculateProgress(project.task);
                const tasksCompleted = project.task.filter(t => t.status === 'DONE' || t.status === 'ARCHIVED').length;

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 hover:shadow-lg transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                        {project.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[project.status]}`}>
                        {STATUS_LABELS[project.status]}
                      </span>
                    </div>

                    {/* Description */}
                    {project.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    {/* Dates */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                      <span>📅 {formatDate(project.start_date, 'Non défini')}</span>
                      <span>→</span>
                      <span>{formatDate(project.end_date, 'Non défini')}</span>
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Progression</span>
                        <span>{tasksCompleted}/{project._count.task} tâches</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Membres */}
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {project.project_member.slice(0, 5).map((member, idx) => {
                          const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500'];
                          const bgColor = colors[idx % colors.length];
                          const photoUrl = resolveImageUrl(member.user?.profile_photo_url);

                          return (
                            <div
                              key={member.id}
                              className={`w-8 h-8 rounded-full ${bgColor} border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-semibold text-white overflow-hidden`}
                              title={member.user?.full_name}
                            >
                              {photoUrl ? (
                                <img
                                  src={photoUrl}
                                  alt={member.user?.full_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                member.user?.full_name?.charAt(0).toUpperCase() || '?'
                              )}
                            </div>
                          );
                        })}
                        {project._count.project_member > 5 && (
                          <div className="w-8 h-8 rounded-full bg-gray-400 dark:bg-gray-600 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-semibold text-white">
                            +{project._count.project_member - 5}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {project._count.project_member} membre{project._count.project_member > 1 ? 's' : ''}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </ComponentCard>
      </div>
    </div>
  );
}
