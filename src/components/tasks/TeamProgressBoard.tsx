"use client";

import React, { useState, useEffect } from "react";
import { authService } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface MemberProgress {
  user: {
    id: number;
    full_name: string;
    profile_photo_url: string | null;
    role: string;
  };
  stats: {
    total: number;
    done: number;
    inProgress: number;
    todo: number;
    overdue: number;
    completionRate: number;
  };
  lastCompletedTask: {
    id: number;
    title: string;
    completed_at: string;
  } | null;
}

interface Activity {
  id: number;
  action: string;
  message: string;
  user: {
    id: number;
    full_name: string;
    profile_photo_url: string | null;
  };
  task: {
    id: number;
    title: string;
  };
  createdAt: string;
}

interface TeamProgressBoardProps {
  projectId: number;
}

export default function TeamProgressBoard({ projectId }: TeamProgressBoardProps) {
  const [membersProgress, setMembersProgress] = useState<MemberProgress[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"progress" | "activity">("progress");

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [progressRes, activityRes] = await Promise.all([
        authService.authenticatedFetch(`${API_BASE_URL}/tasks/project/${projectId}/members-progress`),
        authService.authenticatedFetch(`${API_BASE_URL}/tasks/project/${projectId}/activity-log?limit=20`),
      ]);

      if (progressRes.ok) {
        const progressData = await progressRes.json();
        setMembersProgress(progressData.data?.members || []);
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setActivities(activityData.data || []);
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString("fr-FR");
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "COMPLETED":
        return "✅";
      case "CREATED":
        return "➕";
      case "UPDATED":
        return "✏️";
      case "MOVED":
        return "↔️";
      case "COMMENTED":
        return "💬";
      case "ASSIGNED":
        return "👤";
      default:
        return "📋";
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("progress")}
          className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
            activeTab === "progress"
              ? "text-primary border-b-2 border-primary bg-primary/5"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          👥 Progression de l&apos;équipe
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
            activeTab === "activity"
              ? "text-primary border-b-2 border-primary bg-primary/5"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          📋 Activité récente
        </button>
      </div>

      <div className="p-6">
        {/* Progression par membre */}
        {activeTab === "progress" && (
          <div className="space-y-4">
            {membersProgress.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Aucun membre dans ce projet
              </p>
            ) : (
              membersProgress.map((member) => (
                <div
                  key={member.user.id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {member.user.profile_photo_url ? (
                        <img
                          src={member.user.profile_photo_url}
                          alt={member.user.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-primary">
                          {member.user.full_name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                          {member.user.full_name}
                        </h4>
                        {member.user.role === "owner" && (
                          <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                            Chef de projet
                          </span>
                        )}
                      </div>

                      {/* Barre de progression */}
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${member.stats.completionRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 w-12">
                          {member.stats.completionRate}%
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="mt-2 flex flex-wrap gap-3 text-xs">
                        <span className="text-green-600 dark:text-green-400">
                          ✓ {member.stats.done} terminées
                        </span>
                        <span className="text-blue-600 dark:text-blue-400">
                          ⏳ {member.stats.inProgress} en cours
                        </span>
                        <span className="text-gray-500">
                          📋 {member.stats.todo} à faire
                        </span>
                        {member.stats.overdue > 0 && (
                          <span className="text-red-600 dark:text-red-400">
                            ⚠️ {member.stats.overdue} en retard
                          </span>
                        )}
                      </div>

                      {/* Dernière tâche terminée */}
                      {member.lastCompletedTask && (
                        <p className="mt-2 text-xs text-gray-400">
                          Dernière terminée: &quot;{member.lastCompletedTask.title}&quot; •{" "}
                          {formatTimeAgo(member.lastCompletedTask.completed_at)}
                        </p>
                      )}
                    </div>

                    {/* Score */}
                    <div className="text-center flex-shrink-0">
                      <div className="text-2xl font-bold text-primary">
                        {member.stats.done}
                      </div>
                      <div className="text-xs text-gray-500">
                        sur {member.stats.total}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Journal d'activité */}
        {activeTab === "activity" && (
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Aucune activité récente
              </p>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {/* Icon */}
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">{getActionIcon(activity.action)}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTimeAgo(activity.createdAt)}
                    </p>
                  </div>

                  {/* Avatar */}
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {activity.user?.profile_photo_url ? (
                      <img
                        src={activity.user.profile_photo_url}
                        alt={activity.user.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        {activity.user?.full_name?.charAt(0) || "?"}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
