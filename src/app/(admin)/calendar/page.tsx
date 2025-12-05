"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/useToast";
import { leavesService, LeaveRequest } from "@/services/leaves.service";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  leaves: LeaveRequest[];
}

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const STATUS_COLORS: Record<string, string> = {
  Approved: "bg-green-500",
  Pending: "bg-yellow-500",
  Rejected: "bg-red-500",
  Cancelled: "bg-gray-500",
};

export default function CalendarPage() {
  const { role: userRole } = useUserRole();
  const toast = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [viewMode, setViewMode] = useState<"all" | "approved">("approved");

  const isAdmin = userRole?.role === "ROLE_ADMIN" || userRole?.role === "ROLE_SUPER_ADMIN" || userRole?.role === "ROLE_RH";

  useEffect(() => {
    loadLeaves();
  }, [currentDate, viewMode]);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // Get first and last day of month (with buffer for overlapping leaves)
      const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0];
      const endDate = new Date(year, month + 2, 0).toISOString().split("T")[0];
      
      let data: LeaveRequest[];
      if (isAdmin) {
        data = await leavesService.getAllLeaveRequests();
      } else {
        data = await leavesService.getMyLeaves();
      }
      
      // Filter by status if needed
      if (viewMode === "approved") {
        data = data.filter(l => l.status === "Approved");
      }
      
      setLeaves(data);
    } catch (error) {
      console.error("Erreur chargement congés:", error);
    } finally {
      setLoading(false);
    }
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Adjust to start on Monday
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Previous month days
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        leaves: getLeavesForDate(date),
      });
    }
    
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        leaves: getLeavesForDate(date),
      });
    }
    
    // Next month days to complete the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        leaves: getLeavesForDate(date),
      });
    }
    
    return days;
  }, [currentDate, leaves]);

  const getLeavesForDate = (date: Date): LeaveRequest[] => {
    return leaves.filter(leave => {
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Calendrier" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📅 Calendrier</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Vue d'ensemble des congés et absences
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as "all" | "approved")}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
          >
            <option value="approved">Congés approuvés</option>
            <option value="all">Tous les congés</option>
          </select>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {/* Navigation */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20"
            >
              Aujourd'hui
            </button>
          </div>
          
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Days header */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {DAYS.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                onClick={() => day.leaves.length > 0 && setSelectedDay(day)}
                className={`min-h-[100px] p-2 border-b border-r border-gray-200 dark:border-gray-700 ${
                  !day.isCurrentMonth ? "bg-gray-50 dark:bg-gray-900/50" : ""
                } ${day.isToday ? "bg-blue-50 dark:bg-blue-900/20" : ""} ${
                  day.leaves.length > 0 ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" : ""
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  day.isToday 
                    ? "text-primary" 
                    : day.isCurrentMonth 
                      ? "text-gray-900 dark:text-white" 
                      : "text-gray-400 dark:text-gray-600"
                }`}>
                  {day.date.getDate()}
                </div>
                
                {/* Leave indicators */}
                <div className="space-y-1">
                  {day.leaves.slice(0, 3).map((leave, i) => (
                    <div
                      key={i}
                      className={`text-xs px-1.5 py-0.5 rounded truncate text-white ${STATUS_COLORS[leave.status] || "bg-gray-500"}`}
                      title={`${leave.user?.full_name || "Employé"} - ${leave.leave_type?.name || "Congé"}`}
                    >
                      {isAdmin ? (leave.user?.full_name?.split(" ")[0] || "?") : (leave.leave_type?.name || "Congé")}
                    </div>
                  ))}
                  {day.leaves.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      +{day.leaves.length - 3} autres
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Légende</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Approuvé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">En attente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Refusé</span>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedDay(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedDay.date.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <button onClick={() => setSelectedDay(null)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {selectedDay.leaves.map((leave) => (
                <div key={leave.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {leave.user?.full_name || "Employé"}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full text-white ${STATUS_COLORS[leave.status]}`}>
                      {leave.status === "Approved" ? "Approuvé" : leave.status === "Pending" ? "En attente" : leave.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div>{leave.leave_type?.name || "Type non défini"}</div>
                    <div className="text-xs mt-1">
                      Du {new Date(leave.start_date).toLocaleDateString("fr-FR")} au {new Date(leave.end_date).toLocaleDateString("fr-FR")}
                    </div>
                    {leave.reason && (
                      <div className="text-xs mt-1 italic">"{leave.reason}"</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
