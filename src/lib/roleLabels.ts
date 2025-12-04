import { UserRole } from "@/types/api";

// Labels de base
const ROLE_LABELS: Record<UserRole, string> = {
  ROLE_SUPER_ADMIN: "Super Administrateur",
  ROLE_ADMIN: "Administrateur",
  ROLE_MANAGER: "Manager",
  ROLE_RH: "Ressources Humaines",
  ROLE_EMPLOYEE: "Employé",
};

// Labels avec emojis
const ROLE_LABELS_WITH_EMOJI: Record<UserRole, string> = {
  ROLE_SUPER_ADMIN: "👑 Super Admin",
  ROLE_ADMIN: "⚙️ Administrateur",
  ROLE_RH: "📋 Ressources Humaines",
  ROLE_MANAGER: "👔 Manager",
  ROLE_EMPLOYEE: "💼 Employé",
};

// Catégories de rôles
export const ROLE_CATEGORIES = {
  administration: {
    label: "🔐 Administration",
    roles: ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"] as UserRole[],
  },
  gestion: {
    label: "👥 Gestion",
    roles: ["ROLE_RH", "ROLE_MANAGER"] as UserRole[],
  },
  standard: {
    label: "👤 Standard",
    roles: ["ROLE_EMPLOYEE"] as UserRole[],
  },
};

// Couleurs des badges par rôle
export const ROLE_COLORS: Record<UserRole, { bg: string; text: string; darkBg: string; darkText: string }> = {
  ROLE_SUPER_ADMIN: {
    bg: "bg-red-100",
    text: "text-red-700",
    darkBg: "dark:bg-red-900/30",
    darkText: "dark:text-red-400",
  },
  ROLE_ADMIN: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    darkBg: "dark:bg-orange-900/30",
    darkText: "dark:text-orange-400",
  },
  ROLE_RH: {
    bg: "bg-cyan-100",
    text: "text-cyan-700",
    darkBg: "dark:bg-cyan-900/30",
    darkText: "dark:text-cyan-400",
  },
  ROLE_MANAGER: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    darkBg: "dark:bg-amber-900/30",
    darkText: "dark:text-amber-400",
  },
  ROLE_EMPLOYEE: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    darkBg: "dark:bg-blue-900/30",
    darkText: "dark:text-blue-400",
  },
};

// Hiérarchie des rôles (plus le nombre est bas, plus le rôle est important)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  ROLE_SUPER_ADMIN: 1,
  ROLE_ADMIN: 2,
  ROLE_RH: 3,
  ROLE_MANAGER: 4,
  ROLE_EMPLOYEE: 5,
};

const humanizeRole = (role: string): string => {
  const cleaned = role.replace(/^ROLE_/, "");
  const words = cleaned
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase());
  return words.join(" ") || role;
};

export const formatUserRole = (role?: string | null, withEmoji = false): string => {
  if (!role) {
    return "Rôle non défini";
  }

  if (withEmoji && ROLE_LABELS_WITH_EMOJI[role as UserRole]) {
    return ROLE_LABELS_WITH_EMOJI[role as UserRole];
  }

  if (ROLE_LABELS[role as UserRole]) {
    return ROLE_LABELS[role as UserRole];
  }

  return humanizeRole(role);
};

export const getRoleBadgeClass = (role?: string | null): string => {
  if (!role || !ROLE_COLORS[role as UserRole]) {
    return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
  }
  const colors = ROLE_COLORS[role as UserRole];
  return `${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`;
};

export const getRoleEmoji = (role?: string | null): string => {
  const emojis: Record<string, string> = {
    ROLE_SUPER_ADMIN: "👑",
    ROLE_ADMIN: "⚙️",
    ROLE_RH: "📋",
    ROLE_MANAGER: "👔",
    ROLE_EMPLOYEE: "💼",
  };
  return emojis[role || ""] || "👤";
};

// Trier les rôles par hiérarchie
export const sortRolesByHierarchy = (roles: UserRole[]): UserRole[] => {
  return [...roles].sort((a, b) => (ROLE_HIERARCHY[a] || 99) - (ROLE_HIERARCHY[b] || 99));
};

export const USER_ROLE_LABELS = ROLE_LABELS;
export const USER_ROLE_LABELS_WITH_EMOJI = ROLE_LABELS_WITH_EMOJI;
