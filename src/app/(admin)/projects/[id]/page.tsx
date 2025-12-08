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
import KanbanBoard from "@/components/tasks/KanbanBoard";
import TeamProgressBoard from "@/components/tasks/TeamProgressBoard";

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
  const [activeView, setActiveView] = useState<"kanban" | "list" | "calendar" | "team">("kanban");
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);
  
  // Filtres et recherche
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterAssignee, setFilterAssignee] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Création de colonne
  const [showColumnForm, setShowColumnForm] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

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

  // Fonction pour déplacer une tâche (utilisé par KanbanBoard)
  const handleTaskMove = async (taskId: number, newColumnId: number) => {
    try {
      await projectsService.moveTask(taskId, newColumnId);
      toast.success("Tâche déplacée");
      loadData();
    } catch (error) {
      toast.error("Erreur lors du déplacement");
    }
  };

  // Fonction pour créer une nouvelle colonne
  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim() || !board) return;
    
    try {
      await projectsService.createColumn(board.id, newColumnName.trim());
      toast.success("Colonne créée");
      setNewColumnName("");
      setShowColumnForm(false);
      loadData();
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  };

  // Filtrer les tâches selon les critères
  const getFilteredColumns = () => {
    if (!board) return [];
    
    return board.task_column.map(column => ({
      ...column,
      task: (column.task || []).filter(task => {
        // Filtre recherche
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(query);
          const matchDesc = task.description?.toLowerCase().includes(query);
          if (!matchTitle && !matchDesc) return false;
        }
        
        // Filtre priorité
        if (filterPriority !== "ALL" && task.priority !== filterPriority) {
          return false;
        }
        
        // Filtre assigné
        if (filterAssignee !== null) {
          const isAssigned = task.task_assignment?.some(a => a.user?.id === filterAssignee);
          if (!isAssigned) return false;
        }
        
        return true;
      }),
    }));
  };

  const filteredColumns = getFilteredColumns();
  const hasActiveFilters = searchQuery || filterPriority !== "ALL" || filterAssignee !== null;

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

        {/* View Tabs + Export */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
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
            <button
              onClick={() => setActiveView("team")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === "team"
                  ? "bg-primary text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Équipe
            </button>
          </div>

          {/* Bouton Export */}
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/tasks/project/${projectId}/export/excel`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exporter Excel
          </a>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Recherche */}
            <div className="relative flex-1 min-w-[250px] max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une tâche..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Bouton filtres */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                showFilters || hasActiveFilters
                  ? "bg-primary/10 border-primary text-primary"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtres
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-primary rounded-full"></span>
              )}
            </button>

            {/* Réinitialiser les filtres */}
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterPriority("ALL");
                  setFilterAssignee(null);
                }}
                className="text-sm text-gray-500 hover:text-primary"
              >
                Réinitialiser
              </button>
            )}
          </div>

          {/* Panneau de filtres */}
          {showFilters && (
            <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              {/* Filtre Priorité */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Priorité
                </label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary/30"
                >
                  <option value="ALL">Toutes</option>
                  <option value="LOW">Basse</option>
                  <option value="MEDIUM">Moyenne</option>
                  <option value="HIGH">Haute</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>

              {/* Filtre Assigné */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Assigné à
                </label>
                <select
                  value={filterAssignee ?? ""}
                  onChange={(e) => setFilterAssignee(e.target.value ? Number(e.target.value) : null)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary/30 min-w-[180px]"
                >
                  <option value="">Tous les membres</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Views */}
        {activeView === "list" && (
          <TaskListView projectId={projectId} onTaskUpdate={loadData} />
        )}

        {activeView === "calendar" && (
          <TaskCalendarView projectId={projectId} onTaskUpdate={loadData} />
        )}

        {/* Kanban Board avec Drag & Drop */}
        {activeView === "kanban" && (
          <div className="flex gap-4">
            <div className="flex-1">
              <KanbanBoard
                columns={filteredColumns}
                onTaskMove={handleTaskMove}
                onTaskClick={(task) => setSelectedTaskForModal(task)}
                onTaskDelete={handleDeleteTask}
                onAddTask={openTaskForm}
              />
            </div>
            
            {/* Bouton Ajouter Colonne */}
            <div className="flex-shrink-0">
              {showColumnForm ? (
                <div className="w-72 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
                  <form onSubmit={handleCreateColumn}>
                    <input
                      type="text"
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      placeholder="Nom de la colonne..."
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-3"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                      >
                        Créer
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowColumnForm(false); setNewColumnName(""); }}
                        className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <button
                  onClick={() => setShowColumnForm(true)}
                  className="w-72 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-500 transition-colors"
                >
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter une colonne
                </button>
              )}
            </div>
          </div>
        )}

        {/* Vue Équipe - Progression par membre */}
        {activeView === "team" && (
          <TeamProgressBoard projectId={projectId} />
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
