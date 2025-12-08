"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { authService } from "@/lib/auth";
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
} from "@/services/projects.service";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  completed_at?: string;
  project: { id: number; name: string };
  task_column?: { id: number; name: string };
}

interface Stats {
  total: number;
  done: number;
  inProgress: number;
  todo: number;
  blocked: number;
  overdue: number;
  dueSoon: number;
  completionRate: number;
}

const STATUS_COLORS: Record<string, string> = {
  TODO: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  BLOCKED: "bg-red-100 text-red-700",
  DONE: "bg-green-100 text-green-700",
};

export default function MyTasksPage() {
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [tasksRes, statsRes] = await Promise.all([
        authService.authenticatedFetch(
          `${API_BASE_URL}/tasks/my-tasks?status=${filterStatus}&priority=${filterPriority}`
        ),
        authService.authenticatedFetch(`${API_BASE_URL}/tasks/my-tasks/stats`),
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.data || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des tâches");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPriority, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      const res = await authService.authenticatedFetch(
        `${API_BASE_URL}/tasks/my-tasks/${taskId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (res.ok) {
        toast.success("Statut mis à jour");
        loadData();
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("fr-FR");
  };

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === "DONE") return false;
    return new Date(task.due_date) < new Date();
  };

  const isDueSoon = (task: Task) => {
    if (!task.due_date || task.status === "DONE") return false;
    const dueDate = new Date(task.due_date);
    const now = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Mes Tâches" />

      <div className="space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-600">{stats.done}</div>
              <div className="text-xs text-gray-500">Terminées</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              <div className="text-xs text-gray-500">En cours</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-gray-600">{stats.todo}</div>
              <div className="text-xs text-gray-500">À faire</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-orange-600">{stats.blocked}</div>
              <div className="text-xs text-gray-500">Bloquées</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-red-500">
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <div className="text-xs text-gray-500">En retard</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-yellow-500">
              <div className="text-2xl font-bold text-yellow-600">{stats.dueSoon}</div>
              <div className="text-xs text-gray-500">Bientôt dues</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-primary">{stats.completionRate}%</div>
              <div className="text-xs text-gray-500">Progression</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Statut</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="TODO">À faire</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="BLOCKED">Bloqué</option>
                <option value="DONE">Terminé</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Priorité</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
              >
                <option value="all">Toutes les priorités</option>
                <option value="CRITICAL">Critique</option>
                <option value="HIGH">Haute</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="LOW">Basse</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-gray-500">Chargement...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2">📋</div>
              <p className="text-gray-500">Aucune tâche assignée</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    isOverdue(task) ? "bg-red-50 dark:bg-red-900/10" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Status Selector */}
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                      className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[task.status]}`}
                    >
                      <option value="TODO">À faire</option>
                      <option value="IN_PROGRESS">En cours</option>
                      <option value="BLOCKED">Bloqué</option>
                      <option value="DONE">Terminé</option>
                    </select>

                    {/* Task Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-medium ${task.status === "DONE" ? "line-through text-gray-400" : "text-gray-900 dark:text-white"}`}>
                          {task.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${TASK_PRIORITY_COLORS[task.priority]}`}>
                          {TASK_PRIORITY_LABELS[task.priority]}
                        </span>
                        {isOverdue(task) && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                            ⚠️ En retard
                          </span>
                        )}
                        {isDueSoon(task) && !isOverdue(task) && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                            ⏰ Bientôt
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <Link
                          href={`/projects/${task.project.id}`}
                          className="hover:text-primary hover:underline"
                        >
                          📁 {task.project.name}
                        </Link>
                        {task.task_column && (
                          <span>📌 {task.task_column.name}</span>
                        )}
                        {task.due_date && (
                          <span className={isOverdue(task) ? "text-red-500 font-medium" : ""}>
                            📅 {formatDate(task.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
