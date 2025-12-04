"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import {
  attendanceService,
  Attendance,
  AttendanceStats,
  GlobalAttendanceStats,
} from "@/services/attendanceService";

// Icônes simples en SVG inline
const ClockIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const LogInIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
  </svg>
);

const LogOutIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export default function AttendancePage() {
  const { user } = useAuth();
  const toast = useToast();
  
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [myStats, setMyStats] = useState<AttendanceStats | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalAttendanceStats | null>(null);
  const [history, setHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mise à jour de l'horloge
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Charger les données
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [today, stats, historyData, global] = await Promise.all([
        attendanceService.getTodayAttendance(),
        attendanceService.getMyMonthlyStats(),
        attendanceService.getMyAttendance(),
        attendanceService.getGlobalStats().catch(() => null),
      ]);
      setTodayAttendance(today);
      setMyStats(stats);
      setHistory(historyData);
      setGlobalStats(global);
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      const attendance = await attendanceService.checkIn();
      setTodayAttendance(attendance);
      toast.success("Arrivée pointée avec succès !");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors du pointage");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setCheckingOut(true);
      const attendance = await attendanceService.checkOut();
      setTodayAttendance(attendance);
      toast.success("Départ pointé avec succès !");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors du pointage");
    } finally {
      setCheckingOut(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTimeFromString = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PRESENT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      LATE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      ABSENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      REMOTE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      ON_LEAVE: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      HALF_DAY: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    };
    const labels: Record<string, string> = {
      PRESENT: "Présent",
      LATE: "En retard",
      ABSENT: "Absent",
      REMOTE: "Télétravail",
      ON_LEAVE: "En congé",
      HALF_DAY: "Demi-journée",
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || "bg-gray-100"}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pointage</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez votre présence quotidienne
          </p>
        </div>
      </div>

      {/* Horloge et Boutons de pointage */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Horloge */}
          <div className="text-center lg:text-left">
            <div className="flex items-center gap-3 mb-2">
              <ClockIcon />
              <span className="text-blue-200">Heure actuelle</span>
            </div>
            <div className="text-5xl font-bold mb-2">{formatTime(currentTime)}</div>
            <div className="text-blue-200 capitalize">{formatDate(currentTime)}</div>
          </div>

          {/* Boutons Check-in/out */}
          <div className="flex flex-col sm:flex-row gap-4">
            {!todayAttendance?.check_in ? (
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {checkingIn ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                ) : (
                  <LogInIcon />
                )}
                Pointer mon arrivée
              </button>
            ) : !todayAttendance?.check_out ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-lg">
                  <CheckIcon />
                  <span>Arrivée: {formatTimeFromString(todayAttendance.check_in)}</span>
                </div>
                <button
                  onClick={handleCheckOut}
                  disabled={checkingOut}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  {checkingOut ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  ) : (
                    <LogOutIcon />
                  )}
                  Pointer mon départ
                </button>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-lg">
                  <CheckIcon />
                  <span>Arrivée: {formatTimeFromString(todayAttendance.check_in)}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-lg">
                  <CheckIcon />
                  <span>Départ: {formatTimeFromString(todayAttendance.check_out)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Statut aujourd'hui */}
        {todayAttendance && (
          <div className="mt-6 pt-6 border-t border-blue-500/30">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="text-blue-200">Statut:</span>
              {getStatusBadge(todayAttendance.status)}
              {todayAttendance.worked_hours && (
                <span className="text-blue-200">
                  Heures travaillées: <strong>{todayAttendance.worked_hours.toFixed(2)}h</strong>
                </span>
              )}
              {todayAttendance.overtime_hours && todayAttendance.overtime_hours > 0 && (
                <span className="text-yellow-300">
                  Heures supp: <strong>{todayAttendance.overtime_hours.toFixed(2)}h</strong>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="text-3xl font-bold text-green-600">{myStats?.presentDays || 0}</div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">Jours présent</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="text-3xl font-bold text-yellow-600">{myStats?.lateDays || 0}</div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">Retards</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="text-3xl font-bold text-blue-600">{myStats?.totalWorkedHours?.toFixed(1) || 0}h</div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">Heures ce mois</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="text-3xl font-bold text-purple-600">{myStats?.totalOvertimeHours?.toFixed(1) || 0}h</div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">Heures supp.</div>
        </div>
      </div>

      {/* Stats globales (Admin) */}
      {globalStats && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Statistiques du jour (Admin)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{globalStats.checkedIn}</div>
              <div className="text-xs text-gray-500">Présents</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{globalStats.notCheckedIn}</div>
              <div className="text-xs text-gray-500">Non pointés</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{globalStats.late}</div>
              <div className="text-xs text-gray-500">En retard</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{globalStats.attendanceRate}%</div>
              <div className="text-xs text-gray-500">Taux présence</div>
            </div>
          </div>
        </div>
      )}

      {/* Historique récent */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Historique récent
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Arrivée</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Départ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Heures</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Aucun historique de pointage
                  </td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(record.date).toLocaleDateString("fr-FR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatTimeFromString(record.check_in)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatTimeFromString(record.check_out)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {record.worked_hours ? `${record.worked_hours.toFixed(2)}h` : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
