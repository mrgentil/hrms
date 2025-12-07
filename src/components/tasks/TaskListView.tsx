"use client";

import React, { useState, useEffect } from "react";
import {
  taskFeaturesService,
  TaskWithDetails,
} from "@/services/taskFeatures.service";
import TaskDetailModal from "./TaskDetailModal";

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_COLORS: Record<string, string> = {
  TODO: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  BLOCKED: "bg-red-100 text-red-700",
  DONE: "bg-green-100 text-green-700",
  ARCHIVED: "bg-gray-200 text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  BLOCKED: "Bloqué",
  DONE: "Terminé",
  ARCHIVED: "Archivé",
};

interface TaskListViewProps {
  projectId: number;
  onTaskUpdate?: () => void;
}

export default function TaskListView({ projectId, onTaskUpdate }: TaskListViewProps) {
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);

  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [sortBy, setSortBy] = useState<"due_date" | "priority" | "status">("due_date");

  useEffect(() => {
    loadTasks();
  }, [projectId, statusFilter, priorityFilter]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await taskFeaturesService.getTasksList(projectId, {
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: searchTerm || undefined,
      });
      setTasks(data);
    } catch (error) {
      console.error("Erreur chargement tâches:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "due_date") {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    if (sortBy === "priority") {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) -
             (priorityOrder[b.priority as keyof typeof priorityOrder] || 4);
    }
    return 0;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return <span className="text-red-500">En retard</span>;
    if (diffDays === 0) return <span className="text-orange-500">Aujourd'hui</span>;
    if (diffDays === 1) return <span className="text-orange-400">Demain</span>;
    
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const getChecklistProgress = (task: TaskWithDetails) => {
    if (!task.task_checklists?.length) return null;
    const total = task.task_checklists.reduce((acc, c) => acc + c.items.length, 0);
    const completed = task.task_checklists.reduce(
      (acc, c) => acc + c.items.filter((i) => i.is_completed).length,
      0
    );
    if (total === 0) return null;
    return { completed, total, percent: Math.round((completed / total) * 100) };
  };

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher une tâche..."
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
        />
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
        >
          <option value="">Tous les statuts</option>
          <option value="TODO">À faire</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="BLOCKED">Bloqué</option>
          <option value="DONE">Terminé</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
        >
          <option value="">Toutes priorités</option>
          <option value="CRITICAL">Critique</option>
          <option value="HIGH">Haute</option>
          <option value="MEDIUM">Moyenne</option>
          <option value="LOW">Basse</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
        >
          <option value="due_date">Trier par échéance</option>
          <option value="priority">Trier par priorité</option>
        </select>
      </div>

      {/* Liste */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Aucune tâche trouvée
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tâche</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priorité</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Échéance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignés</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedTasks.map((task) => {
                const checklistProgress = getChecklistProgress(task);
                
                return (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            {task.task_comments && task.task_comments.length > 0 && (
                              <span>💬 {task.task_comments.length}</span>
                            )}
                            {task.task_attachments && task.task_attachments.length > 0 && (
                              <span>📎 {task.task_attachments.length}</span>
                            )}
                            {task.subtasks && task.subtasks.length > 0 && (
                              <span>📋 {task.subtasks.length}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[task.status]}`}>
                        {STATUS_LABELS[task.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {formatDate(task.due_date)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex -space-x-2">
                        {task.task_assignment?.slice(0, 3).map((assignment, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-full bg-primary/10 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium text-primary"
                            title={assignment.user.full_name}
                          >
                            {assignment.user.full_name.charAt(0)}
                          </div>
                        ))}
                        {task.task_assignment && task.task_assignment.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs text-gray-500">
                            +{task.task_assignment.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {checklistProgress && (
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${checklistProgress.percent}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {checklistProgress.completed}/{checklistProgress.total}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal détail */}
      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask.id}
          taskTitle={selectedTask.title}
          taskDescription={selectedTask.description}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => {
            loadTasks();
            onTaskUpdate?.();
          }}
        />
      )}
    </div>
  );
}
