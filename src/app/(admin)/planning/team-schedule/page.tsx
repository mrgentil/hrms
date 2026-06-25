"use client";

import React, { useState, useEffect, useMemo } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { planningService, TeamMemberSchedule, ScheduleEvent } from "@/services/planning.service";
import { useAuth } from "@/contexts/AuthContext";
import Avatar from "@/components/ui/avatar/Avatar";
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Helper for dates
const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
};

const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};

const formatDateForApi = (date: Date) => date.toISOString().split("T")[0];

const formatDateDisplay = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "2-digit", month: "short" }).format(date);
};

export default function TeamSchedulePage() {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [scheduleData, setScheduleData] = useState<TeamMemberSchedule[]>([]);
    const [loading, setLoading] = useState(true);

    const weekDays = useMemo(() => {
        const start = getStartOfWeek(currentDate);
        return Array.from({ length: 5 }).map((_, i) => addDays(start, i)); // Lundi à Vendredi
    }, [currentDate]);

    const loadSchedule = async () => {
        try {
            setLoading(true);
            const startDate = formatDateForApi(weekDays[0]);
            const endDate = formatDateForApi(weekDays[4]);
            const data = await planningService.getTeamSchedule(startDate, endDate);
            setScheduleData(data);
        } catch (error) {
            console.error("Erreur lors du chargement du planning:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSchedule();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentDate]);

    const handlePrevWeek = () => setCurrentDate(prev => addDays(prev, -7));
    const handleNextWeek = () => setCurrentDate(prev => addDays(prev, 7));
    const handleToday = () => setCurrentDate(new Date());

    const getEventsForDay = (events: ScheduleEvent[], day: Date) => {
        const dayStr = formatDateForApi(day);
        return events.filter(e => {
            const start = e.start_date.split("T")[0];
            const end = e.end_date.split("T")[0];
            return dayStr >= start && dayStr <= end;
        });
    };

    return (
        <div className="space-y-6">
            <PageBreadcrumb pageTitle="Planning d'Équipe" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
                        Disponibilités de l'équipe
                    </h3>
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                        <button
                            onClick={handlePrevWeek}
                            className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 shadow-sm transition"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleToday}
                            className="px-4 py-2 text-sm font-medium hover:bg-white dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300 shadow-sm transition"
                        >
                            Aujourd'hui
                        </button>
                        <button
                            onClick={handleNextWeek}
                            className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 shadow-sm transition"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="py-4 px-4 font-semibold text-sm text-gray-600 dark:text-gray-400 w-64 min-w-[250px]">
                                        Employé
                                    </th>
                                    {weekDays.map((day, i) => (
                                        <th key={i} className="py-4 px-4 font-semibold text-sm text-gray-600 dark:text-gray-400 min-w-[120px] text-center border-l border-gray-200 dark:border-gray-700">
                                            <span className="block text-xs uppercase text-gray-400">{new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(day)}</span>
                                            <span className={`block text-lg ${formatDateForApi(day) === formatDateForApi(new Date()) ? 'text-primary font-bold' : 'text-gray-800 dark:text-white'}`}>
                                                {day.getDate()}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {scheduleData.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                                            Aucun membre d'équipe trouvé.
                                        </td>
                                    </tr>
                                ) : (
                                    scheduleData.map((member) => (
                                        <tr key={member.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition">
                                            <td className="py-3 px-4 flex items-center gap-3">
                                                <Avatar src={member.profile_photo_url} alt={member.full_name} size="sm" />
                                                <div>
                                                    <p className="font-medium text-sm text-gray-900 dark:text-white">{member.full_name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-40">{member.position?.title || member.department?.name || "Employé"}</p>
                                                </div>
                                            </td>
                                            {weekDays.map((day, i) => {
                                                const dayEvents = getEventsForDay(member.events, day);
                                                return (
                                                    <td key={i} className="py-3 px-2 border-l border-gray-100 dark:border-gray-800 text-center align-middle">
                                                        {dayEvents.length > 0 ? (
                                                            <div className="flex flex-col gap-1">
                                                                {dayEvents.map(event => (
                                                                    <div 
                                                                        key={event.id}
                                                                        className={`text-[10px] sm:text-xs font-medium px-2 py-1 rounded-md truncate mx-auto w-full max-w-[110px] ${
                                                                            event.type === 'LEAVE' 
                                                                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' 
                                                                                : event.type === 'REMOTE'
                                                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                                        }`}
                                                                        title={event.title}
                                                                    >
                                                                        {event.title}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-full flex justify-center items-center">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700"></span>
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
