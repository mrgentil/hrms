"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import EmployeeNavigation from "@/components/Sidebar/EmployeeNavigation";
import { useSocket } from "@/contexts/SocketContext";
import {
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  PieChartIcon,
  PlugInIcon,
  UserIcon,
  GroupIcon,
  TaskIcon,
  DollarLineIcon,
  ChatIcon,
  ShootingStarIcon,
} from "../icons/index";

type RoleCode =
  | "ROLE_EMPLOYEE"
  | "ROLE_MANAGER"
  | "ROLE_RH"
  | "ROLE_ADMIN"
  | "ROLE_SUPER_ADMIN";

type NavSubItem = {
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
  allowedRoles?: RoleCode[];
  requiredPermission?: string;
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  allowedRoles?: RoleCode[];
  requiredPermission?: string;
  subItems?: NavSubItem[];
};

// --- NAVIGATION GROUPS BY INTENT ---

const moiNavItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Mon Espace",
    path: "/",
  },
  {
    icon: <ChatIcon />,
    name: "Messagerie",
    path: "/messages",
  },
  {
    icon: <CalenderIcon />,
    name: "Mon Pointage",
    path: "/attendance",
  },
  {
    icon: <DollarLineIcon />,
    name: "Mes Notes de Frais",
    path: "/expenses",
  },
  {
    icon: <CalenderIcon />,
    name: "Mes Congés",
    path: "/leaves/my-leaves",
    requiredPermission: "leaves.view",
  },
  {
    icon: <DollarLineIcon />,
    name: "Ma Paie",
    requiredPermission: "payroll.view_own",
    subItems: [
      { name: "Mes Bulletins", path: "/payroll/my-payslips" },
      { name: "Demander une Avance", path: "/payroll/advances" },
      { name: "Demandes de Fonds", path: "/payroll/fund-requests" },
      { name: "Simulateur de Salaire", path: "/payroll/simulator" },
    ],
  },
  {
    icon: <TaskIcon />,
    name: "Mes Projets & Tâches",
    subItems: [
      { name: "Mes Projets", path: "/employees/projects" },
      { name: "Mes Tâches", path: "/my-tasks" },
    ],
  },
  {
    icon: <ShootingStarIcon />,
    name: "Mes Formations",
    path: "/training/my-trainings",
    requiredPermission: "training.view_own",
  },
];

const equipeNavItems: NavItem[] = [
  {
    icon: <GroupIcon />,
    name: "Vision Équipe",
    allowedRoles: ["ROLE_MANAGER", "ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
    subItems: [
      { name: "Annuaire des employés", path: "/employees" },
      { name: "Organigramme", path: "/employees/organigramme" },
      { name: "Recherche collaborateurs", path: "/employees/search" },
      { name: "Annonces d'équipe", path: "/employees/announcements" },
    ],
  },
  {
    icon: <CalenderIcon />,
    name: "Supervision Équipe",
    allowedRoles: ["ROLE_MANAGER", "ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
    subItems: [
      { name: "Planning d'Équipe", path: "/planning/team-schedule" },
      { name: "Validation Congés", path: "/leaves/review", requiredPermission: "leaves.approve" },
      { name: "Suivi Performance", path: "/performance/reviews" },
    ],
  },
];

const rhTalentsNavItems: NavItem[] = [
  {
    icon: <UserIcon />,
    name: "Recrutement",
    requiredPermission: "recruitment.view",
    allowedRoles: ["ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
    subItems: [
      { name: "Offres d'Emploi", path: "/recruitment/jobs" },
      { name: "Candidatures", path: "/recruitment/applications" },
      { name: "Entretiens", path: "/recruitment/interviews" },
      { name: "Onboarding", path: "/recruitment/onboarding" },
    ],
  },
  {
    icon: <TaskIcon />,
    name: "Plan de Développement",
    requiredPermission: "training.view",
    allowedRoles: ["ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
    subItems: [
      { name: "Catalogue Formations", path: "/training/catalog" },
      { name: "Plan de Formation", path: "/training/development-plans" },
    ],
  },
  {
    icon: <GroupIcon />,
    name: "Structure & Contrats",
    requiredPermission: "departments.view",
    allowedRoles: ["ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
    subItems: [
      { name: "Départements", path: "/departments" },
      { name: "Postes", path: "/positions" },
      { name: "Contrats", path: "/contracts" },
    ],
  },
];

const financeNavItems: NavItem[] = [
  {
    icon: <DollarLineIcon />,
    name: "Flux Financiers",
    requiredPermission: "payroll.view",
    allowedRoles: ["ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
    subItems: [
      { name: "Gestion Salaires", path: "/payroll/salaries" },
      { name: "Primes & Bonus", path: "/payroll/bonuses" },
      { name: "Avantages Sociaux", path: "/payroll/benefits" },
    ],
  },
];

const systemNavItems: NavItem[] = [
  {
    icon: <UserIcon />,
    name: "Configuration & Accès",
    requiredPermission: "roles.manage",
    allowedRoles: ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
    subItems: [
      { name: "Utilisateurs", path: "/users" },
      { name: "Rôles & Permissions", path: "/users/roles" },
      { name: "Configuration Menus", path: "/users/menus" },
    ],
  },
  {
    icon: <PlugInIcon />,
    name: "Réglages Système",
    requiredPermission: "system.admin",
    allowedRoles: ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
    subItems: [
      { name: "Paramètres", path: "/settings" },
      { name: "Logs & Audit", path: "/admin/logs" },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { role: userRole, loading: roleLoading } = useUserRole();
  const { settings, getImageUrl } = useAppSettings();
  const { unreadCount } = useSocket();

  // Un utilisateur est "employé seulement" s'il a le rôle EMPLOYEE ET aucune permission admin
  const isEmployeeOnly = useMemo(() => {
    if (!userRole) return true;
    const hasAdminPermissions = userRole.permissions.some(p =>
      p.startsWith('users.') ||
      p.startsWith('departments.') ||
      p.startsWith('positions.') ||
      p.startsWith('reports.') ||
      p.startsWith('leaves.manage') ||
      p === 'system.admin'
    );
    if (hasAdminPermissions) return false;
    return userRole.role === "ROLE_EMPLOYEE";
  }, [userRole]);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: string;
    index: number;
  } | null>(null);

  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isAccessAllowed = useCallback(
    (allowedRoles?: RoleCode[], requiredPermission?: string, itemName?: string) => {
      if ((!allowedRoles || allowedRoles.length === 0) && !requiredPermission) {
        return true;
      }
      if (!userRole) return false;
      if (userRole.isSuperAdmin) return true;
      if (requiredPermission) {
        const permissions = requiredPermission.split(',').map(p => p.trim());
        if (permissions.some(p => userRole.permissions.includes(p))) return true;
      }
      if (allowedRoles && allowedRoles.length > 0) {
        if (allowedRoles.includes(userRole.role)) return true;
      }
      return false;
    },
    [userRole]
  );

  const filterNavItems = useCallback(
    (items: NavItem[]) =>
      items.reduce<NavItem[]>((visible, item) => {
        if (!isAccessAllowed(item.allowedRoles, item.requiredPermission, item.name)) {
          return visible;
        }
        if (item.subItems) {
          const filteredSubItems = item.subItems.filter((sub) =>
            isAccessAllowed(sub.allowedRoles, sub.requiredPermission, sub.name)
          );
          if (filteredSubItems.length > 0) {
            visible.push({ ...item, subItems: filteredSubItems });
          }
          return visible;
        }
        visible.push(item);
        return visible;
      }, []),
    [isAccessAllowed]
  );

  const visibleMoiItems = useMemo(() => filterNavItems(moiNavItems), [filterNavItems]);
  const visibleEquipeItems = useMemo(() => filterNavItems(equipeNavItems), [filterNavItems]);
  const visibleRhItems = useMemo(() => filterNavItems(rhTalentsNavItems), [filterNavItems]);
  const visibleFinanceItems = useMemo(() => filterNavItems(financeNavItems), [filterNavItems]);
  const visibleSystemItems = useMemo(() => filterNavItems(systemNavItems), [filterNavItems]);

  const isActive = useCallback((path: string) => pathname === path, [pathname]);

  useEffect(() => {
    if (isEmployeeOnly) {
      setOpenSubmenu(null);
      return;
    }
    let submenuMatched = false;
    const menuMap: Record<string, NavItem[]> = {
      moi: visibleMoiItems,
      equipe: visibleEquipeItems,
      rh: visibleRhItems,
      finance: visibleFinanceItems,
      system: visibleSystemItems,
    };

    Object.keys(menuMap).forEach((menuType) => {
      menuMap[menuType].forEach((nav, index) => {
        nav.subItems?.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ type: menuType, index });
            submenuMatched = true;
          }
        });
      });
    });

    if (!submenuMatched) setOpenSubmenu(null);
  }, [isEmployeeOnly, isActive, visibleMoiItems, visibleEquipeItems, visibleRhItems, visibleFinanceItems, visibleSystemItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: string) => {
    setOpenSubmenu((prev) => {
      if (prev && prev.type === menuType && prev.index === index) return null;
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: string) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={`${nav.name}-${index}`}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${openSubmenu?.type === menuType && openSubmenu?.index === index
                ? "menu-item-active"
                : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
            >
              <span className={`${openSubmenu?.type === menuType && openSubmenu?.index === index ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto h-5 w-5 transition-transform duration-200 ${openSubmenu?.type === menuType && openSubmenu?.index === index ? "rotate-180 text-brand-500" : ""}`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}`}
              >
                <span className={`relative ${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                  {nav.icon}
                  {nav.path === "/messages" && unreadCount > 0 && !(isExpanded || isHovered || isMobileOpen) && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <>
                    <span className="menu-item-text">{nav.name}</span>
                    {nav.path === "/messages" && unreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white dark:ring-gray-900 animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => { subMenuRefs.current[`${menuType}-${index}`] = el; }}
              className="overflow-hidden transition-all duration-300"
              style={{ height: openSubmenu?.type === menuType && openSubmenu?.index === index ? `${subMenuHeight[`${menuType}-${index}`]}px` : "0px" }}
            >
              <ul className="ml-9 mt-2 space-y-1">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${isActive(subItem.path) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"}`}
                    >
                      {subItem.name}
                      <span className="ml-auto flex items-center gap-1">
                        {subItem.new && <span className={`menu-dropdown-badge ${isActive(subItem.path) ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"}`}>new</span>}
                        {subItem.pro && <span className={`menu-dropdown-badge ${isActive(subItem.path) ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"}`}>pro</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed top-0 left-0 z-50 mt-16 flex h-screen flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 lg:mt-0 
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"} flex`}>
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              {settings.logo_light ? (
                <img className="dark:hidden h-10 w-auto" src={getImageUrl(settings.logo_light)} alt={settings.app_name || "Logo"} />
              ) : (
                <Image className="dark:hidden" src="/images/logo/logo.svg" alt={settings.app_name || "Logo"} width={150} height={40} priority style={{ height: 'auto', width: 'auto' }} />
              )}
              {settings.logo_dark ? (
                <img className="hidden dark:block h-10 w-auto" src={getImageUrl(settings.logo_dark)} alt={settings.app_name || "Logo"} />
              ) : (
                <Image className="hidden dark:block" src="/images/logo/logo-dark.svg" alt={settings.app_name || "Logo"} width={150} height={40} priority style={{ height: 'auto', width: 'auto' }} />
              )}
            </>
          ) : (
            <>
              {settings.favicon ? (
                <img className="h-8 w-8" src={getImageUrl(settings.favicon)} alt={settings.app_name || "Logo"} />
              ) : (
                <Image src="/images/logo/logo-icon.svg" alt={settings.app_name || "Logo"} width={32} height={32} style={{ height: 'auto', width: 'auto' }} />
              )}
            </>
          )}
        </Link>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        {roleLoading ? (
          <div className="flex flex-1 items-center justify-center py-10 text-sm text-gray-500 dark:text-gray-400">Chargement du menu...</div>
        ) : !userRole ? (
          <div className="flex flex-1 items-center justify-center py-10 text-sm text-gray-500 dark:text-gray-400">Accès non authentifié.</div>
        ) : isEmployeeOnly ? (
          <EmployeeNavigation className="pb-10" />
        ) : (
          <nav className="mb-6">
            <div className="flex flex-col gap-6">
              {/* MOI / MON / MES */}
              {visibleMoiItems.length > 0 && (
                <div>
                  <h2 className={`mb-4 flex text-[10px] font-bold uppercase tracking-wider text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
                    {isExpanded || isHovered || isMobileOpen ? "Moi / Mon / Mes" : <HorizontaLDots />}
                  </h2>
                  {renderMenuItems(visibleMoiItems, "moi")}
                </div>
              )}

              {/* MON ÉQUIPE */}
              {visibleEquipeItems.length > 0 && (
                <div>
                  <h2 className={`mb-4 flex text-[10px] font-bold uppercase tracking-wider text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
                    {isExpanded || isHovered || isMobileOpen ? "Mon Équipe" : <HorizontaLDots />}
                  </h2>
                  {renderMenuItems(visibleEquipeItems, "equipe")}
                </div>
              )}

              {/* GESTION DES TALENTS */}
              {visibleRhItems.length > 0 && (
                <div>
                  <h2 className={`mb-4 flex text-[10px] font-bold uppercase tracking-wider text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
                    {isExpanded || isHovered || isMobileOpen ? "Gestion des Talents" : <HorizontaLDots />}
                  </h2>
                  {renderMenuItems(visibleRhItems, "rh")}
                </div>
              )}

              {/* FINANCE & PAIE */}
              {visibleFinanceItems.length > 0 && (
                <div>
                  <h2 className={`mb-4 flex text-[10px] font-bold uppercase tracking-wider text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
                    {isExpanded || isHovered || isMobileOpen ? "Finance & Paie" : <HorizontaLDots />}
                  </h2>
                  {renderMenuItems(visibleFinanceItems, "finance")}
                </div>
              )}

              {/* CONFIGURATION & SYSTÈME */}
              {visibleSystemItems.length > 0 && (
                <div>
                  <h2 className={`mb-4 flex text-[10px] font-bold uppercase tracking-wider text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
                    {isExpanded || isHovered || isMobileOpen ? "Système & Configuration" : <HorizontaLDots />}
                  </h2>
                  {renderMenuItems(visibleSystemItems, "system")}
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
