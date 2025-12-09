"use client";

import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Task,
  TaskColumn,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
} from "@/services/projects.service";

// ============================================
// TYPES
// ============================================

interface KanbanBoardProps {
  columns: TaskColumn[];
  onTaskMove: (taskId: number, newColumnId: number) => Promise<void>;
  onTaskClick: (task: Task) => void;
  onTaskDelete: (taskId: number) => void;
  onAddTask: (columnId: number) => void;
  onColumnEdit?: (columnId: number, newName: string) => Promise<void>;
  onColumnDelete?: (columnId: number) => Promise<void>;
}

// ============================================
// SORTABLE TASK CARD
// ============================================

interface SortableTaskCardProps {
  task: Task;
  onClick: () => void;
  onDelete: () => void;
}

function SortableTaskCard({ task, onClick, onDelete }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-2 border-gray-100 dark:border-gray-700 cursor-grab active:cursor-grabbing hover:shadow-lg hover:border-primary/30 transition-all group ${
        isDragging ? "shadow-2xl scale-105 rotate-2" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-gray-900 dark:text-white text-sm leading-tight">
          {task.title}
        </h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${TASK_PRIORITY_COLORS[task.priority]}`}
        >
          {TASK_PRIORITY_LABELS[task.priority]}
        </span>

        {task.due_date && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(task.due_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </span>
        )}

        {task.task_assignment && task.task_assignment.length > 0 && (
          <div className="flex -space-x-2">
            {task.task_assignment.slice(0, 3).map((a, idx) => {
              const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500"];
              return (
                <div
                  key={a.id}
                  className={`w-7 h-7 rounded-full ${colors[idx % colors.length]} border-2 border-white dark:border-gray-800 flex items-center justify-center text-[10px] font-bold text-white shadow-sm`}
                  title={a.user?.full_name || "Membre"}
                >
                  {a.user?.profile_photo_url ? (
                    <img
                      src={a.user.profile_photo_url}
                      alt={a.user.full_name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    (a.user?.full_name || "M").charAt(0).toUpperCase()
                  )}
                </div>
              );
            })}
            {task.task_assignment.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-gray-400 border-2 border-white dark:border-gray-800 flex items-center justify-center text-[10px] font-bold text-white">
                +{task.task_assignment.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// TASK CARD OVERLAY (pendant le drag)
// ============================================

function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-2xl border-2 border-primary/50 cursor-grabbing rotate-3 scale-105">
      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
        {task.title}
      </h4>
      {task.description && (
        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{task.description}</p>
      )}
    </div>
  );
}

// ============================================
// DROPPABLE COLUMN
// ============================================

interface DroppableColumnProps {
  column: TaskColumn;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskDelete: (taskId: number) => void;
  onAddTask: () => void;
  onColumnEdit?: (columnId: number, newName: string) => Promise<void>;
  onColumnDelete?: (columnId: number) => Promise<void>;
}

function DroppableColumn({ column, tasks, onTaskClick, onTaskDelete, onAddTask, onColumnEdit, onColumnDelete }: DroppableColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);
  const [showMenu, setShowMenu] = useState(false);

  // Rendre la colonne droppable
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const columnColors: Record<string, string> = {
    "À faire": "from-gray-500 to-gray-600",
    "En cours": "from-blue-500 to-blue-600",
    "En révision": "from-yellow-500 to-yellow-600",
    "En revue": "from-yellow-500 to-yellow-600",
    "Terminé": "from-green-500 to-green-600",
    "Terminée": "from-green-500 to-green-600",
    "Bloqué": "from-red-500 to-red-600",
    "Bloquée": "from-red-500 to-red-600",
    "Archivé": "from-purple-500 to-purple-600",
    "Archivée": "from-purple-500 to-purple-600",
  };

  const bgColor = columnColors[column.name] || "from-gray-500 to-gray-600";

  const handleSaveEdit = async () => {
    if (editName.trim() && editName !== column.name && onColumnEdit) {
      await onColumnEdit(column.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (tasks.length > 0) {
      alert("Impossible de supprimer une colonne contenant des tâches. Déplacez ou supprimez d'abord les tâches.");
      return;
    }
    if (confirm(`Supprimer la colonne "${column.name}" ?`) && onColumnDelete) {
      await onColumnDelete(column.id);
    }
    setShowMenu(false);
  };

  return (
    <div className="w-80 flex-shrink-0">
      {/* Column Header */}
      <div className={`bg-gradient-to-r ${bgColor} rounded-t-xl px-4 py-3 shadow-lg`}>
        <div className="flex items-center justify-between">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
              className="flex-1 bg-white/20 text-white placeholder-white/60 rounded px-2 py-1 text-sm font-bold outline-none"
              autoFocus
            />
          ) : (
            <h3 className="font-bold text-white flex items-center gap-2">
              {column.name}
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {tasks.length}
              </span>
            </h3>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={onAddTask}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              title="Ajouter une tâche"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            {(onColumnEdit || onColumnDelete) && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  title="Options"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
                    {onColumnEdit && (
                      <button
                        onClick={() => { setIsEditing(true); setShowMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Renommer
                      </button>
                    )}
                    {onColumnDelete && (
                      <button
                        onClick={handleDelete}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Supprimer
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tasks Container */}
      <div 
        ref={setNodeRef}
        className={`rounded-b-xl p-3 min-h-[400px] max-h-[70vh] overflow-y-auto transition-colors ${
          isOver 
            ? "bg-primary/20 ring-2 ring-primary ring-inset" 
            : "bg-gray-100/80 dark:bg-gray-800/50"
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">Aucune tâche</p>
                <button
                  onClick={onAddTask}
                  className="mt-2 text-primary text-sm font-medium hover:underline"
                >
                  + Ajouter une tâche
                </button>
              </div>
            ) : (
              tasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task)}
                  onDelete={() => onTaskDelete(task.id)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

// ============================================
// MAIN KANBAN BOARD
// ============================================

export default function KanbanBoard({
  columns,
  onTaskMove,
  onTaskClick,
  onTaskDelete,
  onAddTask,
  onColumnEdit,
  onColumnDelete,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findTask = (taskId: number): Task | undefined => {
    for (const column of columns) {
      const task = column.task?.find((t) => t.id === taskId);
      if (task) return task;
    }
    return undefined;
  };

  const findColumnByTaskId = (taskId: number): TaskColumn | undefined => {
    return columns.find((col) => col.task?.some((t) => t.id === taskId));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = findTask(event.active.id as number);
    if (task) setActiveTask(task);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDragOver = (_event: DragOverEvent) => {
    // Pour le moment, on ne gère pas le réordonnancement intra-colonne
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTaskId = active.id as number;
    const overId = over.id;

    // Trouver la colonne de destination
    const activeColumn = findColumnByTaskId(activeTaskId);
    let targetColumnId: number | null = null;

    // Vérifier si on drop sur une colonne ou sur une tâche
    const overColumn = columns.find((col) => col.id === overId);
    if (overColumn) {
      targetColumnId = overColumn.id;
    } else {
      // On a droppé sur une tâche, trouver sa colonne
      const targetColumn = findColumnByTaskId(overId as number);
      if (targetColumn) {
        targetColumnId = targetColumn.id;
      }
    }

    if (targetColumnId && activeColumn?.id !== targetColumnId) {
      await onTaskMove(activeTaskId, targetColumnId);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-5 min-w-max px-1 py-2">
          {columns.map((column) => (
            <DroppableColumn
              key={column.id}
              column={column}
              tasks={column.task || []}
              onTaskClick={onTaskClick}
              onTaskDelete={onTaskDelete}
              onAddTask={() => onAddTask(column.id)}
              onColumnEdit={onColumnEdit}
              onColumnDelete={onColumnDelete}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
