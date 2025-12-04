"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { useUserRole } from "@/hooks/useUserRole";
import {
  attendanceService,
  Attendance,
  AttendanceStats,
  GlobalAttendanceStats,
} from "@/services/attendanceService";
import { employeesService, Employee } from "@/services/employees.service";

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
  const { role: userRole } = useUserRole();
  
  // État pour la vue personnelle
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [myStats, setMyStats] = useState<AttendanceStats | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalAttendanceStats | null>(null);
  const [history, setHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // État pour la vue admin
  const [activeTab, setActiveTab] = useState<"personal" | "admin">("personal");
  const [allAttendance, setAllAttendance] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  
  // Filtres admin
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  
  const isAdmin = userRole?.role === "ROLE_ADMIN" || userRole?.role === "ROLE_SUPER_ADMIN" || userRole?.role === "ROLE_RH";

  // Mise à jour de l'horloge
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Charger les données personnelles
  useEffect(() => {
    loadData();
  }, []);

  // Charger les données admin quand on change d'onglet ou de filtres
  useEffect(() => {
    if (activeTab === "admin" && isAdmin) {
      loadAdminData();
    }
  }, [activeTab, filterDate, filterEndDate, filterEmployee, filterStatus]);

  // Charger la liste des employés pour le filtre
  useEffect(() => {
    if (isAdmin) {
      employeesService.getEmployees({ limit: 1000 })
        .then((data) => setEmployees(data.data || data))
        .catch(console.error);
    }
  }, [isAdmin]);

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

  const loadAdminData = async () => {
    try {
      setLoadingAdmin(true);
      const data = await attendanceService.getAllAttendance(
        filterDate,
        filterEndDate || filterDate,
        filterEmployee ? parseInt(filterEmployee) : undefined
      );
      setAllAttendance(data);
    } catch (error) {
      console.error("Erreur chargement données admin:", error);
      toast.error("Erreur lors du chargement des pointages");
    } finally {
      setLoadingAdmin(false);
    }
  };

  const handleCheckIn = async () => {
    console.log("handleCheckIn called");
    try {
      setCheckingIn(true);
      console.log("Calling attendanceService.checkIn...");
      const attendance = await attendanceService.checkIn();
      console.log("CheckIn response:", attendance);
      setTodayAttendance(attendance);
      toast.success("Arrivée pointée avec succès !");
      loadData();
    } catch (error: any) {
      console.error("CheckIn error:", error);
      toast.error(error?.message || "Erreur lors du pointage");
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

  // Filtrer les données admin
  const filteredAttendance = allAttendance.filter((record) => {
    if (filterStatus && record.status !== filterStatus) return false;
    if (filterDepartment && record.user?.department_user_department_idTodepartment?.department_name !== filterDepartment) return false;
    return true;
  });

  // Obtenir les départements uniques depuis les pointages
  const departments = [...new Set(allAttendance.map(a => a.user?.department_user_department_idTodepartment?.department_name).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec onglets */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pointage</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {activeTab === "personal" ? "Gérez votre présence quotidienne" : "Consultez les pointages de tous les employés"}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("personal")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "personal"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Mon Pointage
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "admin"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Tous les Pointages
            </button>
          </div>
        )}
      </div>

      {/* Vue personnelle */}
      {activeTab === "personal" && (
        <>
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
        </>
      )}

      {/* Vue admin - Tous les pointages */}
      {activeTab === "admin" && isAdmin && (
        <div className="space-y-6">
          {/* Filtres */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Filtres</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Date début */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date début
                </label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                />
              </div>
              
              {/* Date fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date fin
                </label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                />
              </div>
              
              {/* Employé */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Employé
                </label>
                <select
                  value={filterEmployee}
                  onChange={(e) => setFilterEmployee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                >
                  <option value="">Tous les employés</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Département */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Département
                </label>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                >
                  <option value="">Tous les départements</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Statut
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                >
                  <option value="">Tous les statuts</option>
                  <option value="PRESENT">Présent</option>
                  <option value="LATE">En retard</option>
                  <option value="ABSENT">Absent</option>
                  <option value="REMOTE">Télétravail</option>
                  <option value="ON_LEAVE">En congé</option>
                </select>
              </div>
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{filteredAttendance.length}</div>
              <div className="text-gray-500 dark:text-gray-400 text-sm">Total pointages</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                {filteredAttendance.filter(a => a.status === "PRESENT").length}
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-sm">Présents</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredAttendance.filter(a => a.status === "LATE").length}
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-sm">En retard</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-purple-600">
                {filteredAttendance.filter(a => a.check_out).length}
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-sm">Départs pointés</div>
            </div>
          </div>

          {/* Tableau des pointages */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Liste des pointages ({filteredAttendance.length})
              </h2>
              <button
                onClick={loadAdminData}
                disabled={loadingAdmin}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingAdmin ? "Chargement..." : "Actualiser"}
              </button>
            </div>
            <div className="overflow-x-auto">
              {loadingAdmin ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Employé</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Département</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Arrivée</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Départ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Heures</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredAttendance.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          Aucun pointage trouvé pour ces critères
                        </td>
                      </tr>
                    ) : (
                      filteredAttendance.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-medium text-sm">
                                {record.user?.full_name?.charAt(0) || "?"}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {record.user?.full_name || "Inconnu"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {record.user?.position?.title || "-"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {record.user?.department_user_department_idTodepartment?.department_name || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {new Date(record.date).toLocaleDateString("fr-FR", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {record.check_in ? (
                              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                {formatTimeFromString(record.check_in)}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {record.check_out ? (
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {formatTimeFromString(record.check_out)}
                              </span>
                            ) : (
                              <span className="text-sm text-orange-500">En cours...</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {record.worked_hours ? (
                              <span className="font-medium">{record.worked_hours.toFixed(2)}h</span>
                            ) : (
                              "-"
                            )}
                            {record.overtime_hours && record.overtime_hours > 0 && (
                              <span className="ml-1 text-xs text-yellow-600">
                                (+{record.overtime_hours.toFixed(1)}h sup)
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(record.status)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
