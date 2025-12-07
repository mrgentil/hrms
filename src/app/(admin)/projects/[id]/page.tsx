"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {
  projectsService,
  Project,
  ProjectStats,
  TaskBoard,
  Task,
  TaskColumn,
  CreateTaskPayload,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
} from "@/services/projects.service";
import { employeesService, Employee } from "@/services/employees.service";
import TaskListView from "@/components/tasks/TaskListView";
import TaskCalendarView from "@/components/tasks/TaskCalendarView";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const projectId = Number(params.id);

  const [project, setProject] = useState<Project | null>(null);
  const [board, setBoard] = useState<TaskBoard | null>(null);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);
  const [taskForm, setTaskForm] = useState<CreateTaskPayload>({
    title: "",
    description: "",
    priority: "MEDIUM",
    project_id: projectId,
    task_column_id: 0,
    assignee_ids: [],
  });
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [activeView, setActiveView] = useState<"kanban" | "list" | "calendar">("kanban");
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectData, boardData, statsData, employeesData] = await Promise.all([
        projectsService.getProject(projectId),
        projectsService.getBoard(projectId),
        projectsService.getProjectStats(projectId),
        employeesService.getEmployees({ limit: 100 }).then(r => r.data || []),
      ]);
      setProject(projectData);
      setBoard(boardData);
      setStats(statsData);
      setEmployees(employeesData);
    } catch (error) {
      toast.error("Erreur lors du chargement du projet");
      router.push("/projects");
    } finally {
      setLoading(false);
    }
  }, [projectId, router, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openTaskForm = (columnId: number) => {
    setSelectedColumnId(columnId);
    setTaskForm({ ...taskForm, task_column_id: columnId, project_id: projectId });
    setShowTaskForm(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    try {
      await projectsService.createTask(taskForm);
      toast.success("Tâche créée");
      setShowTaskForm(false);
      setTaskForm({
        title: "",
        description: "",
        priority: "MEDIUM",
        project_id: projectId,
        task_column_id: 0,
        assignee_ids: [],
      });
      loadData();
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, columnId: number) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.task_column_id === columnId) {
      setDraggedTask(null);
      return;
    }

    try {
      await projectsService.moveTask(draggedTask.id, columnId);
      loadData();
    } catch (error) {
      toast.error("Erreur lors du déplacement");
    }
    setDraggedTask(null);
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Supprimer cette tâche ?")) return;
    try {
      await projectsService.deleteTask(taskId);
      toast.success("Tâche supprimée");
      loadData();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project || !board) {
    return null;
  }

  return (
    <div>
      <PageBreadcrumb pageTitle={project.name} />

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {project.name}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${PROJECT_STATUS_COLORS[project.status]}`}>
                  {PROJECT_STATUS_LABELS[project.status]}
                </span>
              </div>
              {project.description && (
                <p className="mt-2 text-gray-600 dark:text-gray-400">{project.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/projects"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                ← Retour
              </Link>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total tâches</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.todo}</div>
                <div className="text-xs text-blue-600">À faire</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-amber-600">{stats.inProgress}</div>
                <div className="text-xs text-amber-600">En cours</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-xs text-green-600">Terminées</div>
              </div>
              <div className="bg-primary/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary">{stats.completionRate}%</div>
                <div className="text-xs text-primary">Progression</div>
              </div>
            </div>
          )}
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl p-2 shadow-sm">
          <button
            onClick={() => setActiveView("kanban")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === "kanban"
                ? "bg-primary text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            Kanban
          </button>
          <button
            onClick={() => setActiveView("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === "list"
                ? "bg-primary text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Liste
          </button>
          <button
            onClick={() => setActiveView("calendar")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === "calendar"
                ? "bg-primary text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Calendrier
          </button>
        </div>

        {/* Views */}
        {activeView === "list" && (
          <TaskListView projectId={projectId} onTaskUpdate={loadData} />
        )}

        {activeView === "calendar" && (
          <TaskCalendarView projectId={projectId} onTaskUpdate={loadData} />
        )}

        {/* Kanban Board */}
        {activeView === "kanban" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {board.task_column.map((column) => (
              <div
                key={column.id}
                className="w-80 bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    {column.name}
                    <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full text-xs">
                      {column.task?.length || 0}
                    </span>
                  </h3>
                  <button
                    onClick={() => openTaskForm(column.id)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    <PlusIcon />
                  </button>
                </div>

                {/* Tasks */}
                <div className="space-y-3 min-h-[200px]">
                  {column.task?.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onClick={() => setSelectedTaskForModal(task)}
                      className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md hover:border-primary/50 transition-all ${
                        draggedTask?.id === task.id ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {task.title}
                        </h4>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                          className="p-1 text-gray-400 hover:text-red-500 rounded"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {task.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${TASK_PRIORITY_COLORS[task.priority]}`}>
                          {TASK_PRIORITY_LABELS[task.priority]}
                        </span>

                        {task.task_assignment && task.task_assignment.length > 0 && (
                          <div className="flex -space-x-1">
                            {task.task_assignment.slice(0, 3).map((a, idx) => {
                              const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500'];
                              return (
                                <div
                                  key={a.id}
                                  className={`w-6 h-6 rounded-full ${colors[idx % colors.length]} border-2 border-white dark:border-gray-800 flex items-center justify-center text-[10px] font-semibold text-white overflow-hidden`}
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
                            {task.task_assignment.length > 3 && (
                              <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white dark:border-gray-800 flex items-center justify-center text-[10px] font-semibold text-white">
                                +{task.task_assignment.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {task.due_date && (
                        <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(task.due_date).toLocaleDateString("fr-FR")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Task Button */}
                <button
                  onClick={() => openTaskForm(column.id)}
                  className="w-full mt-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <PlusIcon />
                  Ajouter une tâche
                </button>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Task Form Modal */}
        {showTaskForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Nouvelle tâche
              </h3>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Titre *
                  </label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Titre de la tâche"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Description..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priorité
                    </label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Échéance
                    </label>
                    <input
                      type="date"
                      value={taskForm.due_date || ""}
                      onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assigné à
                  </label>
                  <select
                    multiple
                    value={taskForm.assignee_ids?.map(String) || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => Number(option.value));
                      setTaskForm({ ...taskForm, assignee_ids: selected });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white h-24"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Maintenez Ctrl pour sélectionner plusieurs</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Créer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTaskForm(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Detail Modal */}
        {selectedTaskForModal && (
          <TaskDetailModal
            taskId={selectedTaskForModal.id}
            taskTitle={selectedTaskForModal.title}
            taskDescription={selectedTaskForModal.description}
            isOpen={!!selectedTaskForModal}
            onClose={() => setSelectedTaskForModal(null)}
            onUpdate={loadData}
          />
        )}
      </div>
    </div>
  );
}
