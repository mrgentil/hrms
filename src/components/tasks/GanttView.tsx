"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Task } from "@/services/projects.service";

interface GanttViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-400",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-orange-500",
  CRITICAL: "bg-red-500",
};

const STATUS_COLORS: Record<string, string> = {
  TODO: "bg-gray-400",
  IN_PROGRESS: "bg-blue-500",
  BLOCKED: "bg-red-400",
  DONE: "bg-green-500",
  ARCHIVED: "bg-purple-500",
};

export default function GanttView({ tasks, onTaskClick }: GanttViewProps) {
  const [viewMode, setViewMode] = useState<"week" | "month" | "quarter">("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculer la plage de dates
  const dateRange = useMemo(() => {
    const dates: Date[] = [];
    const start = new Date(currentDate);
    
    if (viewMode === "week") {
      start.setDate(start.getDate() - start.getDay()); // Début de la semaine
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        dates.push(d);
      }
    } else if (viewMode === "month") {
      start.setDate(1); // Début du mois
      const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
      for (let i = 0; i < daysInMonth; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        dates.push(d);
      }
    } else {
      // Quarter (3 mois)
      start.setDate(1);
      for (let m = 0; m < 3; m++) {
        const monthStart = new Date(start);
        monthStart.setMonth(monthStart.getMonth() + m);
        const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
        for (let i = 0; i < daysInMonth; i++) {
          const d = new Date(monthStart);
          d.setDate(d.getDate() + i);
          dates.push(d);
        }
      }
    }
    
    return dates;
  }, [currentDate, viewMode]);

  const startDate = dateRange[0];
  const endDate = dateRange[dateRange.length - 1];
  const totalDays = dateRange.length;

  // Filtrer et trier les tâches
  const sortedTasks = useMemo(() => {
    return [...tasks]
      .filter(t => t.start_date || t.due_date)
      .sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date) : a.due_date ? new Date(a.due_date) : new Date();
        const dateB = b.start_date ? new Date(b.start_date) : b.due_date ? new Date(b.due_date) : new Date();
        return dateA.getTime() - dateB.getTime();
      });
  }, [tasks]);

  const getTaskPosition = (task: Task) => {
    const taskStart = task.start_date ? new Date(task.start_date) : task.due_date ? new Date(task.due_date) : new Date();
    const taskEnd = task.due_date ? new Date(task.due_date) : task.start_date ? new Date(task.start_date) : new Date();

    const startOffset = Math.max(0, Math.floor((taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const endOffset = Math.min(totalDays, Math.ceil((taskEnd.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    
    const left = (startOffset / totalDays) * 100;
    const width = Math.max(2, ((endOffset - startOffset) / totalDays) * 100);

    return { left: `${left}%`, width: `${width}%` };
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", { day: "numeric" });
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString("fr-FR", { month: "short" });
  };

  const navigate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 3 : -3));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Grouper les dates par mois pour l'en-tête
  const monthGroups = useMemo(() => {
    const groups: { month: string; count: number }[] = [];
    let currentMonth = "";
    
    dateRange.forEach(date => {
      const month = formatMonth(date);
      if (month !== currentMonth) {
        groups.push({ month, count: 1 });
        currentMonth = month;
      } else {
        groups[groups.length - 1].count++;
      }
    });
    
    return groups;
  }, [dateRange]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("prev")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20"
          >
            Aujourd&apos;hui
          </button>
          <button
            onClick={() => navigate("next")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <span className="ml-2 font-semibold text-gray-900 dark:text-white">
            {currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          </span>
        </div>

        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(["week", "month", "quarter"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === mode
                  ? "bg-white dark:bg-gray-600 text-primary shadow"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
              }`}
            >
              {mode === "week" ? "Semaine" : mode === "month" ? "Mois" : "Trimestre"}
            </button>
          ))}
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Timeline Header */}
          <div className="flex border-b dark:border-gray-700">
            {/* Task names column */}
            <div className="w-64 flex-shrink-0 bg-gray-50 dark:bg-gray-900 p-3 font-semibold text-gray-700 dark:text-gray-300 border-r dark:border-gray-700">
              Tâches ({sortedTasks.length})
            </div>
            
            {/* Timeline */}
            <div className="flex-1">
              {/* Month row */}
              <div className="flex border-b dark:border-gray-700">
                {monthGroups.map((group, i) => (
                  <div
                    key={i}
                    style={{ width: `${(group.count / totalDays) * 100}%` }}
                    className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-1 border-r dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                  >
                    {group.month}
                  </div>
                ))}
              </div>
              
              {/* Days row */}
              <div className="flex">
                {dateRange.map((date, i) => (
                  <div
                    key={i}
                    style={{ width: `${100 / totalDays}%` }}
                    className={`text-center text-xs py-1 border-r dark:border-gray-700 ${
                      isToday(date)
                        ? "bg-primary/20 text-primary font-bold"
                        : date.getDay() === 0 || date.getDay() === 6
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-400"
                        : "text-gray-500"
                    }`}
                  >
                    {viewMode === "week" || totalDays <= 31 ? formatDate(date) : ""}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Task Rows */}
          {sortedTasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>Aucune tâche avec des dates</p>
              <p className="text-sm">Ajoutez des dates de début/fin aux tâches pour les voir ici</p>
            </div>
          ) : (
            sortedTasks.map((task) => {
              const position = getTaskPosition(task);
              const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "DONE";

              return (
                <div
                  key={task.id}
                  className="flex border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  {/* Task name */}
                  <div
                    className="w-64 flex-shrink-0 p-3 border-r dark:border-gray-700 cursor-pointer"
                    onClick={() => onTaskClick?.(task)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[task.priority] || "bg-gray-400"}`} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate" title={task.title}>
                        {task.title}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {task.start_date && new Date(task.start_date).toLocaleDateString("fr-FR")}
                      {task.start_date && task.due_date && " → "}
                      {task.due_date && new Date(task.due_date).toLocaleDateString("fr-FR")}
                    </div>
                  </div>

                  {/* Timeline bar */}
                  <div className="flex-1 relative h-16">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex">
                      {dateRange.map((date, i) => (
                        <div
                          key={i}
                          style={{ width: `${100 / totalDays}%` }}
                          className={`border-r dark:border-gray-700 ${
                            isToday(date) ? "bg-primary/10" : 
                            date.getDay() === 0 || date.getDay() === 6 ? "bg-gray-50 dark:bg-gray-800/30" : ""
                          }`}
                        />
                      ))}
                    </div>

                    {/* Task bar */}
                    <div
                      className="absolute top-3 h-10 cursor-pointer group"
                      style={{ left: position.left, width: position.width }}
                      onClick={() => onTaskClick?.(task)}
                    >
                      <div
                        className={`h-full rounded-lg shadow-sm flex items-center px-2 text-white text-xs font-medium transition-transform group-hover:scale-105 ${
                          isOverdue ? "bg-red-500" : STATUS_COLORS[task.status] || "bg-gray-400"
                        }`}
                      >
                        <span className="truncate">{task.title}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <span className="text-xs text-gray-500">Légende:</span>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${color}`} />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {status === "TODO" ? "À faire" : 
               status === "IN_PROGRESS" ? "En cours" : 
               status === "BLOCKED" ? "Bloqué" : 
               status === "DONE" ? "Terminé" : "Archivé"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
