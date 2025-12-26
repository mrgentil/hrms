"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { leavesService, LeaveRequest, LeaveStatus } from "@/services/leaves.service";
import { notificationsService, Notification, NOTIFICATION_TYPE_ICONS } from "@/services/notifications.service";
import { useUserRole } from "@/hooks/useUserRole";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

const STATUS_LABELS: Record<LeaveStatus, string> = {
  Approved: "Approuvee",
  Rejected: "Refusee",
  Pending: "En attente",
  Cancelled: "Annulee",
};

const STATUS_BADGES: Record<LeaveStatus, string> = {
  Approved: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  Rejected: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  Pending: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  Cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const LOCAL_STORAGE_KEYS = {
  LEAVE_UPDATES: "hrms:lastSeenLeaveUpdate",
};

const getLastSeenUpdateTimestamp = () => {
  if (typeof window === "undefined") {
    return 0;
  }
  const stored = window.localStorage.getItem(LOCAL_STORAGE_KEYS.LEAVE_UPDATES);
  if (!stored) {
    return 0;
  }
  const parsed = Number.parseInt(stored, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const setLastSeenUpdateTimestamp = (value: number) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(LOCAL_STORAGE_KEYS.LEAVE_UPDATES, String(value));
};

const getUpdateTimestamp = (request: LeaveRequest) => {
  const reference = request.updated_at ?? request.approved_at ?? request.created_at;
  if (!reference) {
    return 0;
  }
  const value = new Date(reference).getTime();
  return Number.isFinite(value) ? value : 0;
};

const formatDateRange = (request: LeaveRequest) => {
  const startDate = new Date(request.start_date);
  const endDate = new Date(request.end_date);
  return `${startDate.toLocaleDateString("fr-FR")} -> ${endDate.toLocaleDateString("fr-FR")}`;
};

const getInitials = (fullName?: string | null) => {
  if (!fullName) {
    return "?";
  }
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  const first = parts[0].charAt(0).toUpperCase();
  const last = parts[parts.length - 1].charAt(0).toUpperCase();
  const initials = `${first}${last}`.trim();
  return initials.length > 0 ? initials : "?";
};

export default function NotificationDropdown() {
  const router = useRouter();
  const { role: userRole, loading: roleLoading } = useUserRole();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [pendingCount, setPendingCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);

  const [myUpdates, setMyUpdates] = useState<LeaveRequest[]>([]);
  const [unreadUpdates, setUnreadUpdates] = useState(0);
  const [latestUpdateTs, setLatestUpdateTs] = useState<number | null>(null);

  // Notifications système (projets, tâches, etc.)
  const [systemNotifications, setSystemNotifications] = useState<Notification[]>([]);
  const [unreadSystemCount, setUnreadSystemCount] = useState(0);

  const canReviewLeaves = useMemo(
    () =>
      !!userRole &&
      (userRole.isManager || userRole.isHR || userRole.isAdmin || userRole.isSuperAdmin),
    [userRole],
  );

  const displayedPendingRequests = useMemo(
    () => pendingRequests.slice(0, 5),
    [pendingRequests],
  );
  const extraPendingCount = Math.max(0, pendingCount - displayedPendingRequests.length);

  const displayedUpdates = useMemo(() => myUpdates.slice(0, 5), [myUpdates]);
  const extraUpdateCount = Math.max(0, myUpdates.length - displayedUpdates.length);

  const totalBadgeCount = (canReviewLeaves ? pendingCount : 0) + unreadUpdates + unreadSystemCount;

  const refreshNotifications = useCallback(async () => {
    if (authLoading) {
      return;
    }

    setLoading(true);
    try {
      let pendingList: LeaveRequest[] = [];
      let pendingTotal = 0;

      if (canReviewLeaves) {
        try {
          const [countResponse, listResponse] = await Promise.all([
            leavesService.getPendingApprovalCount(),
            leavesService.getAssignedLeaveRequests(),
          ]);

          if (countResponse?.success) {
            const rawValue =
              typeof countResponse.data === "number"
                ? countResponse.data
                : countResponse.data?.pending ?? 0;
            const parsed = Number(rawValue);
            pendingTotal = Number.isFinite(parsed) ? parsed : 0;
          }

          if (listResponse?.success && Array.isArray(listResponse.data)) {
            pendingList = listResponse.data as LeaveRequest[];
          }
        } catch (error: any) {
          // Silently ignore 403/404 errors
          if (error?.response?.status !== 403 && error?.response?.status !== 404) {
            console.error("Failed to load pending approvals", error);
          }
        }
      }

      setPendingCount(pendingTotal);
      setPendingRequests(pendingList);

      let updatesList: LeaveRequest[] = [];
      let unread = 0;
      let latestTs: number | null = null;

      if (userId !== null) {
        try {
          const response = await leavesService.getMyLeaveUpdates();
          if (response?.success && Array.isArray(response.data)) {
            updatesList = (response.data as LeaveRequest[]).filter(
              (item) => item.status !== "Pending",
            );
          }
        } catch (error: any) {
          // Silently ignore 403 errors (permission issues)
          if (error?.response?.status !== 403) {
            console.error("Failed to load leave updates", error);
          }
        }
      }

      if (updatesList.length > 0) {
        latestTs = getUpdateTimestamp(updatesList[0]);
        const lastSeen = getLastSeenUpdateTimestamp();
        unread = updatesList.reduce((acc, request) => {
          const updated = getUpdateTimestamp(request);
          return updated > lastSeen ? acc + 1 : acc;
        }, 0);
      }

      setMyUpdates(updatesList);
      setUnreadUpdates(unread);
      setLatestUpdateTs(latestTs);

      // Charger les notifications système (projets, tâches)
      try {
        const sysNotifs = await notificationsService.getNotifications(10);
        setSystemNotifications(sysNotifs);
        const sysUnread = sysNotifs.filter(n => !n.is_read).length;
        setUnreadSystemCount(sysUnread);
      } catch (error: any) {
        // Silently ignore errors for non-critical notifications
      }
    } finally {
      setLoading(false);
    }
  }, [authLoading, canReviewLeaves, userId]);

  const markUpdatesAsRead = useCallback(() => {
    if (!isOpen) {
      return;
    }

    const reference = latestUpdateTs ?? Date.now();
    setLastSeenUpdateTimestamp(reference);
    setUnreadUpdates(0);
  }, [isOpen, latestUpdateTs]);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (!nextState) {
      return;
    }
    refreshNotifications().catch((error) =>
      console.error("Failed to refresh notifications", error),
    );
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (!roleLoading && !authLoading) {
      refreshNotifications();
    }
  }, [authLoading, roleLoading, refreshNotifications]);

  // Polling automatique toutes les 30 secondes pour les nouvelles notifications
  useEffect(() => {
    if (authLoading || roleLoading) return;

    const interval = setInterval(() => {
      // Rafraîchir seulement les notifications système (silencieux)
      notificationsService.getNotifications(10).then((sysNotifs) => {
        setSystemNotifications(sysNotifs);
        const sysUnread = sysNotifs.filter(n => !n.is_read).length;
        setUnreadSystemCount(sysUnread);
      }).catch(() => { });
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [authLoading, roleLoading]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const listener = () => {
      refreshNotifications();
    };

    window.addEventListener("hrms:leave-approvals-updated", listener);
    window.addEventListener("hrms:leave-messages-updated", listener);
    return () => {
      window.removeEventListener("hrms:leave-approvals-updated", listener);
      window.removeEventListener("hrms:leave-messages-updated", listener);
    };
  }, [refreshNotifications]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleFocus = () => {
      refreshNotifications().catch((error) =>
        console.error("Failed to refresh notifications on focus", error),
      );
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshNotifications().catch((error) =>
          console.error("Failed to refresh notifications on visibility change", error),
        );
      }
    };

    const intervalId = window.setInterval(() => {
      refreshNotifications().catch((error) =>
        console.error("Failed to refresh notifications on interval", error),
      );
    }, 30000);

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [refreshNotifications]);

  useEffect(() => {
    if (isOpen && !loading) {
      markUpdatesAsRead();
    }
  }, [isOpen, loading, markUpdatesAsRead]);

  const renderPendingSection = () => {
    if (!canReviewLeaves) {
      return null;
    }

    const emptyStateMessage =
      displayedPendingRequests.length === 0
        ? loading
          ? "Chargement..."
          : "Aucune demande en attente."
        : null;

    return (
      <section>
        <header className="flex items-center justify-between pb-2">
          <h6 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Validations de congés
          </h6>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {pendingCount} en attente
          </span>
        </header>
        {emptyStateMessage ? (
          <p className="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
            {emptyStateMessage}
          </p>
        ) : (
          <ul className="space-y-2">
            {displayedPendingRequests.map((request) => (
              <li key={`pending-${request.id}`}>
                <DropdownItem
                  onItemClick={closeDropdown}
                  href="/leaves/review"
                  className="flex gap-3 rounded-lg border border-gray-100 px-4 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {getInitials(request.user?.full_name)}
                  </span>
                  <span className="flex flex-1 flex-col text-left">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      {request.user?.full_name || "Employe inconnu"}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {request.leave_type?.name || "Type non defini"} · {formatDateRange(request)}
                    </span>
                    {request.reason && (
                      <span className="line-clamp-1 text-xs text-gray-400 dark:text-gray-500">
                        {request.reason}
                      </span>
                    )}
                  </span>
                </DropdownItem>
              </li>
            ))}
            {extraPendingCount > 0 && (
              <li className="text-center text-xs text-gray-500 dark:text-gray-400">
                +{extraPendingCount} autres demandes en attente
              </li>
            )}
          </ul>
        )}
      </section>
    );
  };

  const renderUpdatesSection = () => {
    const emptyStateMessage =
      displayedUpdates.length === 0
        ? loading
          ? "Chargement..."
          : "Aucune mise a jour recente."
        : null;

    return (
      <section>
        <header className="flex items-center justify-between pb-2">
          <h6 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Mes congés
          </h6>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {unreadUpdates} notification{unreadUpdates > 1 ? "s" : ""} non lue{unreadUpdates > 1 ? "s" : ""}
          </span>
        </header>
        {emptyStateMessage ? (
          <p className="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
            {emptyStateMessage}
          </p>
        ) : (
          <ul className="space-y-2">
            {displayedUpdates.map((request) => {
              const statusLabel = STATUS_LABELS[request.status];
              const statusBadge = STATUS_BADGES[request.status];
              const updatedAt = new Date(
                (request.updated_at ?? request.approved_at ?? request.created_at) || "",
              ).toLocaleString("fr-FR");
              return (
                <li key={`update-${request.id}`}>
                  <DropdownItem
                    onItemClick={closeDropdown}
                    href={`/leaves/my-leaves?leaveId=${request.id}`}
                    className="flex gap-3 rounded-lg border border-gray-100 px-4 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
                  >
                    <span className={`inline-flex h-6 min-w-[80px] items-center justify-center rounded-full px-2 text-xs font-semibold ${statusBadge}`}>
                      {statusLabel}
                    </span>
                    <span className="flex flex-1 flex-col text-left">
                      <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                        Votre demande de {request.leave_type?.name || "conge"} est {statusLabel.toLowerCase()}.
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Mise a jour le {updatedAt}
                      </span>
                      {request.approver_comment && (
                        <span className="line-clamp-1 text-xs italic text-gray-400 dark:text-gray-500">
                          Commentaire : {request.approver_comment}
                        </span>
                      )}
                    </span>
                  </DropdownItem>
                </li>
              );
            })}
            {extraUpdateCount > 0 && (
              <li className="text-center text-xs text-gray-500 dark:text-gray-400">
                +{extraUpdateCount} autres mises a jour recentes
              </li>
            )}
          </ul>
        )}
      </section>
    );
  };

  const handleSystemNotificationClick = async (notification: Notification) => {
    closeDropdown();

    if (!notification.is_read) {
      try {
        await notificationsService.markAsRead([notification.id]);
        setSystemNotifications(systemNotifications.map(n =>
          n.id === notification.id ? { ...n, is_read: true } : n
        ));
        setUnreadSystemCount(Math.max(0, unreadSystemCount - 1));
      } catch (error) {
        console.error("Failed to mark notification as read", error);
      }
    }

    if (notification.link) {
      router.push(notification.link);
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diff = now.getTime() - notifDate.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    if (days === 1) return "Hier";
    if (days < 7) return `${days}j`;
    return notifDate.toLocaleDateString("fr-FR");
  };

  const renderSystemNotifications = () => {
    if (systemNotifications.length === 0) {
      return null;
    }

    return (
      <section>
        <header className="flex items-center justify-between pb-2">
          <h6 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Notifications & Formations
          </h6>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {unreadSystemCount} non lue{unreadSystemCount > 1 ? "s" : ""}
          </span>
        </header>
        <ul className="space-y-2">
          {systemNotifications.slice(0, 5).map((notification) => (
            <li key={`sys-${notification.id}`}>
              <button
                onClick={() => handleSystemNotificationClick(notification)}
                className={`w-full flex gap-3 rounded-lg border px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/5 text-left ${!notification.is_read
                    ? "border-primary/30 bg-primary/5"
                    : "border-gray-100 dark:border-gray-800"
                  }`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg">
                  {NOTIFICATION_TYPE_ICONS[notification.type] || "📌"}
                </span>
                <span className="flex flex-1 flex-col">
                  <span className={`text-sm ${!notification.is_read ? "font-semibold" : ""} text-gray-800 dark:text-white/90`}>
                    {notification.title}
                  </span>
                  <span className="line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                    {notification.message}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {getTimeAgo(notification.created_at)}
                  </span>
                </span>
                {!notification.is_read && (
                  <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  };

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleToggle}
      >
        {totalBadgeCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-danger px-1 text-xs font-semibold text-white">
            {totalBadgeCount > 99 ? "99+" : totalBadgeCount.toString()}
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[460px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <header className="border-b border-gray-100 pb-3 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Notifications
            </h5>
            {totalBadgeCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {totalBadgeCount} nouvelle{totalBadgeCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {(canReviewLeaves ? `${pendingCount} a valider` : null) || ""}
            {canReviewLeaves && user ? " · " : ""}
            {user ? `${unreadUpdates} mise${unreadUpdates > 1 ? "s" : ""} a jour` : ""}
          </div>
        </header>

        <div className="mt-3 flex-1 space-y-4 overflow-y-auto custom-scrollbar">
          {renderPendingSection()}
          {renderUpdatesSection()}
          {renderSystemNotifications()}
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {canReviewLeaves && (
            <Link
              href="/leaves/review"
              onClick={closeDropdown}
              className="block rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Gerer les validations
            </Link>
          )}
          <Link
            href="/leaves/my-leaves"
            onClick={closeDropdown}
            className="block rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Voir mes demandes
          </Link>
        </div>
      </Dropdown>
    </div>
  );
}
