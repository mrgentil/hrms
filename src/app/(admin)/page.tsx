"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { useAuth } from "@/contexts/AuthContext";
import {
  analyticsService,
  DashboardOverview,
  AttendanceTrend,
  ExpenseTrend,
  DepartmentStat,
  Activity,
} from "@/services/analyticsService";
import { KPICardSkeleton, ChartSkeleton, ActivitySkeleton } from "@/components/common/Skeleton";

// Import ApexCharts dynamiquement (SSR disabled + loading state)
const ReactApexChart = dynamic(() => import("react-apexcharts"), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-lg" />
});

// Icônes avec animations
const UsersIcon = () => (
  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CashIcon = () => (
  <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const TrendUpIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrend[]>([]);
  const [expensesTrend, setExpensesTrend] = useState<ExpenseTrend[]>([]);
  const [departments, setDepartments] = useState<DepartmentStat[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    setMounted(true);
    loadDashboardData();
  }, []);

  const loadDashboardData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Vider le cache si refresh forcé
      if (forceRefresh) {
        analyticsService.clearCache();
      }
      
      const [overviewData, attendance, expenses, depts, activity] = await Promise.all([
        analyticsService.getDashboardOverview(),
        analyticsService.getAttendanceTrend(),
        analyticsService.getExpensesTrend(),
        analyticsService.getEmployeesByDepartment(),
        analyticsService.getRecentActivity(),
      ]);
      setOverview(overviewData);
      setAttendanceTrend(attendance);
      setExpensesTrend(expenses);
      setDepartments(depts);
      setActivities(activity);
    } catch (error) {
      console.error("Erreur chargement dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  // Données de démo pour les graphiques
  const demoAttendanceTrend: AttendanceTrend[] = [
    { date: "2024-12-01", day: "Lun", count: 45 },
    { date: "2024-12-02", day: "Mar", count: 52 },
    { date: "2024-12-03", day: "Mer", count: 48 },
    { date: "2024-12-04", day: "Jeu", count: 55 },
    { date: "2024-12-05", day: "Ven", count: 42 },
    { date: "2024-12-06", day: "Sam", count: 12 },
    { date: "2024-12-07", day: "Dim", count: 5 },
  ];

  const demoExpensesTrend: ExpenseTrend[] = [
    { month: "Jul", amount: 12500 },
    { month: "Août", amount: 8900 },
    { month: "Sep", amount: 15200 },
    { month: "Oct", amount: 11800 },
    { month: "Nov", amount: 18500 },
    { month: "Déc", amount: 9200 },
  ];

  const demoDepartments: DepartmentStat[] = [
    { id: 1, name: "Développement", count: 25 },
    { id: 2, name: "Marketing", count: 12 },
    { id: 3, name: "RH", count: 8 },
    { id: 4, name: "Finance", count: 10 },
    { id: 5, name: "Commercial", count: 15 },
    { id: 6, name: "Support", count: 7 },
  ];

  const demoActivities: Activity[] = [
    { type: "leave", message: "Jean Dupont a demandé un congé annuel", date: new Date().toISOString(), status: "PENDING" },
    { type: "expense", message: "Marie Martin - Note de frais: Déplacement client", date: new Date(Date.now() - 3600000).toISOString(), status: "APPROVED" },
    { type: "hire", message: "Pierre Bernard a rejoint l'équipe", date: new Date(Date.now() - 86400000).toISOString(), status: "NEW" },
    { type: "leave", message: "Sophie Leroy - Congé maladie approuvé", date: new Date(Date.now() - 172800000).toISOString(), status: "APPROVED" },
    { type: "expense", message: "Lucas Moreau - Équipement bureau", date: new Date(Date.now() - 259200000).toISOString(), status: "PAID" },
    { type: "leave", message: "Emma Petit - Demande de RTT rejetée", date: new Date(Date.now() - 345600000).toISOString(), status: "REJECTED" },
  ];

  const demoOverview: DashboardOverview = {
    employees: { total: 85, active: 77, inactive: 8, newThisMonth: 3 },
    departments: 6,
    attendance: { presentToday: 52, absentToday: 25, attendanceRate: 68 },
    pending: { leaves: 7, expenses: 4 },
    expenses: { totalMonth: 28500 },
  };

  // Utiliser les données de démo si pas de données réelles
  const displayAttendance = attendanceTrend.length > 0 ? attendanceTrend : demoAttendanceTrend;
  const displayExpenses = expensesTrend.length > 0 ? expensesTrend : demoExpensesTrend;
  const displayDepartments = departments.length > 0 ? departments : demoDepartments;
  const displayActivities = activities.length > 0 ? activities : demoActivities;
  const displayOverview = overview || demoOverview;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "leave": return "🏖️";
      case "expense": return "💰";
      case "hire": return "👋";
      default: return "📌";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": case "PAID": return "text-green-600";
      case "PENDING": return "text-yellow-600";
      case "REJECTED": return "text-red-600";
      case "NEW": return "text-blue-600";
      default: return "text-gray-600";
    }
  };

  // Configuration ApexCharts - Graphique Présences
  const attendanceChartOptions: ApexOptions = useMemo(() => ({
    chart: {
      type: "area" as const,
      height: 250,
      fontFamily: "Inter, sans-serif",
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: "easeinout" as const,
        speed: 800,
        animateGradually: { enabled: true, delay: 150 },
        dynamicAnimation: { enabled: true, speed: 350 },
      },
    },
    colors: ["#3b82f6"],
    fill: {
      type: "gradient" as const,
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 100],
      },
    },
    stroke: { curve: "smooth" as const, width: 3 },
    dataLabels: { enabled: false },
    xaxis: {
      categories: displayAttendance.map(d => d.day),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: "#64748b", fontSize: "12px" } },
    },
    yaxis: {
      labels: { style: { colors: "#64748b", fontSize: "12px" } },
    },
    grid: {
      borderColor: "#e2e8f0",
      strokeDashArray: 4,
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    tooltip: {
      theme: "light" as const,
      y: { formatter: (val: number) => `${val} présents` },
    },
  }), [displayAttendance]);

  const attendanceChartSeries = useMemo(() => [{
    name: "Présences",
    data: displayAttendance.map(d => d.count),
  }], [displayAttendance]);

  // Configuration ApexCharts - Graphique Dépenses
  const expensesChartOptions: ApexOptions = useMemo(() => ({
    chart: {
      type: "bar" as const,
      height: 250,
      fontFamily: "Inter, sans-serif",
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: "easeinout" as const,
        speed: 800,
      },
    },
    colors: ["#8b5cf6"],
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: "50%",
        dataLabels: { position: "top" as const },
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: displayExpenses.map(m => m.month),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: "#64748b", fontSize: "12px" } },
    },
    yaxis: {
      labels: {
        style: { colors: "#64748b", fontSize: "12px" },
        formatter: (val: number) => `$${val}`,
      },
    },
    grid: {
      borderColor: "#e2e8f0",
      strokeDashArray: 4,
      yaxis: { lines: { show: true } },
    },
    tooltip: {
      theme: "light" as const,
      y: { formatter: (val: number) => formatCurrency(val) },
    },
  }), [displayExpenses]);

  const expensesChartSeries = useMemo(() => [{
    name: "Dépenses",
    data: displayExpenses.map(m => Number(m.amount)),
  }], [displayExpenses]);

  // Configuration ApexCharts - Donut Départements
  const departmentChartOptions: ApexOptions = useMemo(() => ({
    chart: {
      type: "donut" as const,
      height: 280,
      fontFamily: "Inter, sans-serif",
      animations: {
        enabled: true,
        easing: "easeinout" as const,
        speed: 800,
      },
    },
    colors: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"],
    labels: displayDepartments.slice(0, 6).map(d => d.name),
    legend: {
      position: "bottom" as const,
      fontSize: "12px",
      labels: { colors: "#64748b" },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(0)}%`,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total",
              fontSize: "14px",
              fontWeight: 600,
              color: "#1e293b",
            },
          },
        },
      },
    },
    tooltip: {
      y: { formatter: (val: number) => `${val} employés` },
    },
  }), [displayDepartments]);

  const departmentChartSeries = useMemo(() => 
    displayDepartments.slice(0, 6).map(d => d.count),
  [displayDepartments]);

  // Configuration ApexCharts - Gauge Taux de présence
  const attendanceRateOptions: ApexOptions = useMemo(() => ({
    chart: {
      type: "radialBar" as const,
      height: 200,
      fontFamily: "Inter, sans-serif",
      animations: { enabled: true, easing: "easeinout" as const, speed: 1000 },
    },
    colors: ["#10b981"],
    plotOptions: {
      radialBar: {
        hollow: { size: "60%" },
        track: { background: "#e2e8f0" },
        dataLabels: {
          name: { fontSize: "14px", color: "#64748b", offsetY: 20 },
          value: {
            fontSize: "28px",
            fontWeight: 700,
            color: "#1e293b",
            offsetY: -10,
            formatter: (val: number) => `${val}%`,
          },
        },
      },
    },
    labels: ["Présence"],
  }), []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton Header */}
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        </div>
        {/* Skeleton KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
        </div>
        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height={250} />
          <ChartSkeleton height={250} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec animation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Tableau de bord RH
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Bienvenue, {user?.full_name} 👋
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => loadDashboardData(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm"
          >
            <RefreshIcon />
            <span className="text-sm">Actualiser</span>
          </button>
          <div className="text-sm text-gray-500 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm" suppressHydrationWarning>
            {mounted ? new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            }) : "..."}
          </div>
        </div>
      </div>

      {/* KPI Cards avec animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Employés */}
        <div className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <UsersIcon />
            </div>
            {(displayOverview?.employees.newThisMonth || 0) > 0 && (
              <span className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <TrendUpIcon />
                +{displayOverview?.employees.newThisMonth}
              </span>
            )}
          </div>
          <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
            {displayOverview?.employees.active || 0}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Employés actifs</p>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Inactifs</span>
              <span className="text-gray-600 dark:text-gray-300">{displayOverview?.employees.inactive || 0}</span>
            </div>
          </div>
        </div>

        {/* Présence avec mini gauge */}
        <div className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <ClockIcon />
            </div>
            <div className="w-16 h-16 -mt-2 -mr-2">
              {mounted ? (
                <ReactApexChart
                  options={attendanceRateOptions}
                  series={[displayOverview?.attendance.attendanceRate || 0]}
                  type="radialBar"
                  height={80}
                />
              ) : (
                <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded-full animate-pulse" />
              )}
            </div>
          </div>
          <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
            {displayOverview?.attendance.presentToday || 0}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Présents aujourd'hui</p>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Absents</span>
              <span className="text-red-500">{displayOverview?.attendance.absentToday || 0}</span>
            </div>
          </div>
        </div>

        {/* En attente */}
        <div className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-amber-200 dark:hover:border-amber-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <CalendarIcon />
            </div>
            {((displayOverview?.pending.leaves || 0) + (displayOverview?.pending.expenses || 0)) > 0 && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            )}
          </div>
          <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
            {(displayOverview?.pending.leaves || 0) + (displayOverview?.pending.expenses || 0)}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Demandes en attente</p>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">{displayOverview?.pending.leaves || 0} congés</span>
              <span className="text-gray-400">{displayOverview?.pending.expenses || 0} frais</span>
            </div>
          </div>
        </div>

        {/* Dépenses */}
        <div className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <CashIcon />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {formatCurrency(Number(displayOverview?.expenses.totalMonth) || 0)}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Dépenses ce mois</p>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Notes approuvées</span>
              <span className="text-green-500">✓</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              📊 Présences (7 derniers jours)
            </h3>
          </div>
          {mounted && displayAttendance.length > 0 ? (
            <div style={{ minHeight: 250 }}>
              <ReactApexChart
                key={`attendance-${displayAttendance.length}`}
                options={attendanceChartOptions}
                series={attendanceChartSeries}
                type="area"
                height={250}
                width="100%"
              />
            </div>
          ) : (
            <ChartSkeleton height={250} />
          )}
        </div>

        {/* Expenses Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              💰 Dépenses (6 derniers mois)
            </h3>
          </div>
          {mounted && displayExpenses.length > 0 ? (
            <div style={{ minHeight: 250 }}>
              <ReactApexChart
                key={`expenses-${displayExpenses.length}`}
                options={expensesChartOptions}
                series={expensesChartSeries}
                type="bar"
                height={250}
                width="100%"
              />
            </div>
          ) : (
            <ChartSkeleton height={250} />
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Donut Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            👥 Répartition par département
          </h3>
          {!mounted ? (
            <ChartSkeleton height={280} />
          ) : displayDepartments.length > 0 ? (
            <div style={{ minHeight: 280 }}>
              <ReactApexChart
                key={`departments-${displayDepartments.length}`}
                options={departmentChartOptions}
                series={departmentChartSeries}
                type="donut"
                height={280}
                width="100%"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              Aucun département configuré
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            🕐 Activité récente
          </h3>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
            {displayActivities.length > 0 ? displayActivities.map((activity, i) => (
              <div 
                key={i} 
                className="flex items-start gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                    {activity.message}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400" suppressHydrationWarning>
                      {mounted ? new Date(activity.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }) : "..."}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      activity.status === "APPROVED" || activity.status === "PAID" 
                        ? "bg-green-100 text-green-700" 
                        : activity.status === "PENDING" 
                        ? "bg-yellow-100 text-yellow-700"
                        : activity.status === "REJECTED"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="flex items-center justify-center h-48 text-gray-400">
                Aucune activité récente
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Stats Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSI0Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="group">
            <div className="text-4xl font-bold group-hover:scale-110 transition-transform">
              {displayOverview?.departments || 0}
            </div>
            <div className="text-sm text-blue-200 mt-1">Départements</div>
          </div>
          <div className="group">
            <div className="text-4xl font-bold group-hover:scale-110 transition-transform">
              {displayOverview?.employees.total || 0}
            </div>
            <div className="text-sm text-blue-200 mt-1">Total Employés</div>
          </div>
          <div className="group">
            <div className="text-4xl font-bold group-hover:scale-110 transition-transform">
              {displayOverview?.pending.leaves || 0}
            </div>
            <div className="text-sm text-blue-200 mt-1">Congés en attente</div>
          </div>
          <div className="group">
            <div className="text-4xl font-bold group-hover:scale-110 transition-transform">
              {displayOverview?.pending.expenses || 0}
            </div>
            <div className="text-sm text-blue-200 mt-1">Frais en attente</div>
          </div>
        </div>
      </div>
    </div>
  );
}
