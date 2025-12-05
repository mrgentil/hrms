"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {
  projectsService,
  Project,
  Task,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
} from "@/services/projects.service";

export default function TasksPage() {
  const toast = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadTasks(selectedProjectId);
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectsService.getProjects();
      setProjects(data);
      if (data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des projets");
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async (projectId: number) => {
    try {
      setLoadingTasks(true);
      const data = await projectsService.getTasks(projectId);
      setTasks(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des tâches");
    } finally {
      setLoadingTasks(false);
    }
  };

  const filteredTasks = filterStatus === "all" 
    ? tasks 
    : tasks.filter(t => t.status === filterStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TODO": return "bg-slate-100 text-slate-700";
      case "IN_PROGRESS": return "bg-blue-100 text-blue-700";
      case "BLOCKED": return "bg-red-100 text-red-700";
      case "DONE": return "bg-green-100 text-green-700";
      case "ARCHIVED": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
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
      <PageBreadcrumb pageTitle="Tâches" />

      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Projet
              </label>
              <select
                value={selectedProjectId || ""}
                onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Statut
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Tous les statuts</option>
                {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            {selectedProjectId && (
              <div className="flex items-end">
                <Link
                  href={`/projects/${selectedProjectId}`}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Voir le Kanban
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loadingTasks ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {projects.length === 0 ? (
                <>
                  <p>Aucun projet disponible</p>
                  <Link href="/projects" className="mt-2 text-primary hover:underline inline-block">
                    Créer un projet
                  </Link>
                </>
              ) : (
                <p>Aucune tâche dans ce projet</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Tâche
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Priorité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Assigné à
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Échéance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {task.title}
                          </div>
                          {task.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {task.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {TASK_STATUS_LABELS[task.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${TASK_PRIORITY_COLORS[task.priority]}`}>
                          {TASK_PRIORITY_LABELS[task.priority]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex -space-x-1">
                          {task.task_assignment?.slice(0, 3).map((a, idx) => {
                            const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500'];
                            return (
                              <div
                                key={a.id}
                                className={`w-7 h-7 rounded-full ${colors[idx % colors.length]} border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-semibold text-white overflow-hidden`}
                                title={a.user?.full_name || 'Membre'}
                              >
                                {a.user?.profile_photo_url ? (
                                  <img
                                    src={a.user.profile_photo_url}
                                    alt={a.user.full_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  (a.user?.full_name || 'M').charAt(0).toUpperCase()
                                )}
                              </div>
                            );
                          })}
                          {!task.task_assignment?.length && (
                            <span className="text-gray-400 text-sm">Non assignée</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {task.due_date 
                          ? new Date(task.due_date).toLocaleDateString("fr-FR")
                          : "-"
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
