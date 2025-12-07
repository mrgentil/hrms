"use client";

import React, { useState, useEffect } from "react";
import {
  taskFeaturesService,
  TaskWithDetails,
} from "@/services/taskFeatures.service";
import TaskDetailModal from "./TaskDetailModal";

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-200 border-gray-400",
  MEDIUM: "bg-blue-100 border-blue-400",
  HIGH: "bg-orange-100 border-orange-400",
  CRITICAL: "bg-red-100 border-red-400",
};

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

interface TaskCalendarViewProps {
  projectId: number;
  onTaskUpdate?: () => void;
}

export default function TaskCalendarView({ projectId, onTaskUpdate }: TaskCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    loadTasks();
  }, [projectId, year, month]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await taskFeaturesService.getTasksCalendar(projectId, year, month + 1);
      setTasks(data);
    } catch (error) {
      console.error("Erreur chargement tâches:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Adjust for Monday start
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        return (
          dueDate.getDate() === date.getDate() &&
          dueDate.getMonth() === date.getMonth() &&
          dueDate.getFullYear() === date.getFullYear()
        );
      }
      return false;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="min-h-[100px] bg-gray-50 dark:bg-gray-800/30"
        />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayTasks = getTasksForDate(date);
      const today = isToday(date);

      days.push(
        <div
          key={day}
          className={`min-h-[100px] p-2 border-b border-r border-gray-200 dark:border-gray-700 ${
            today ? "bg-primary/5" : "bg-white dark:bg-gray-800"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${
                today
                  ? "bg-primary text-white font-bold"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              {day}
            </span>
            {dayTasks.length > 0 && (
              <span className="text-xs text-gray-400">
                {dayTasks.length} tâche{dayTasks.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="space-y-1 overflow-hidden max-h-[80px]">
            {dayTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`px-2 py-1 text-xs rounded border-l-2 cursor-pointer truncate hover:opacity-80 ${PRIORITY_COLORS[task.priority]}`}
              >
                {task.title}
              </div>
            ))}
            {dayTasks.length > 3 && (
              <button
                onClick={() => setSelectedDate(date)}
                className="text-xs text-primary hover:underline"
              >
                +{dayTasks.length - 3} autres
              </button>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {MONTHS[month]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <button
          onClick={goToToday}
          className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Aujourd'hui
        </button>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-500">Priorité:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-l-2 bg-gray-200 border-gray-400"></div>
          <span className="text-gray-600">Basse</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-l-2 bg-blue-100 border-blue-400"></div>
          <span className="text-gray-600">Moyenne</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-l-2 bg-orange-100 border-orange-400"></div>
          <span className="text-gray-600">Haute</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-l-2 bg-red-100 border-red-400"></div>
          <span className="text-gray-600">Critique</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Days header */}
            <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700/50">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-r border-gray-200 dark:border-gray-700"
                >
                  {day}
                </div>
              ))}
            </div>
            {/* Calendar cells */}
            <div className="grid grid-cols-7">{renderCalendar()}</div>
          </>
        )}
      </div>

      {/* Modal pour les tâches d'une date */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSelectedDate(null)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">
              Tâches du {selectedDate.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {getTasksForDate(selectedDate).map((task) => (
                <div
                  key={task.id}
                  onClick={() => {
                    setSelectedTask(task);
                    setSelectedDate(null);
                  }}
                  className={`p-3 rounded-lg border-l-4 cursor-pointer hover:opacity-80 ${PRIORITY_COLORS[task.priority]}`}
                >
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {task.task_assignment?.map((a) => a.user.full_name).join(", ") || "Non assigné"}
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setSelectedDate(null)}
              className="mt-4 w-full py-2 text-center text-gray-600 hover:text-gray-900"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modal détail tâche */}
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
