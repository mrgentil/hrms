import { UserRole } from "@/types/api";

const ROLE_LABELS: Record<UserRole, string> = {
  ROLE_SUPER_ADMIN: "Super Administrateur",
  ROLE_ADMIN: "Administrateur",
  ROLE_MANAGER: "Manager",
  ROLE_HR: "Ressources Humaines",
  ROLE_EMPLOYEE: "Employé",
};

const humanizeRole = (role: string): string => {
  const cleaned = role.replace(/^ROLE_/, "");
  const words = cleaned
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase());
  return words.join(" ") || role;
};

export const formatUserRole = (role?: string | null): string => {
  if (!role) {
    return "Rôle non défini";
  }

  if (ROLE_LABELS[role as UserRole]) {
    return ROLE_LABELS[role as UserRole];
  }

  return humanizeRole(role);
};

export const USER_ROLE_LABELS = ROLE_LABELS;
