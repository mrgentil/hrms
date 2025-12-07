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

} from "../icons/index";

// SidebarWidget removed (TailAdmin promo)



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

};



type NavItem = {

  name: string;

  icon: React.ReactNode;

  path?: string;

  allowedRoles?: RoleCode[];

  subItems?: NavSubItem[];

};



const mainNavItems: NavItem[] = [

  {

    icon: <GridIcon />,

    name: "Dashboard",

    path: "/",

    allowedRoles: ["ROLE_MANAGER", "ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

  },

  {

    icon: <CalenderIcon />,

    name: "Pointage",

    path: "/attendance",

  },

  {

    icon: <DollarLineIcon />,

    name: "Notes de Frais",

    path: "/expenses",

  },

  {

    icon: <GroupIcon />,

    name: "Gestion d'équipe",

    allowedRoles: ["ROLE_MANAGER", "ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

    subItems: [

      {

        name: "Annuaire des employés",

        path: "/employees",

        pro: false,

        allowedRoles: ["ROLE_MANAGER", "ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

      {

        name: "Organigramme",

        path: "/employees/organigramme",

        pro: false,

        allowedRoles: ["ROLE_MANAGER", "ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

      {

        name: "Recherche collaborateurs",

        path: "/employees/search",

        pro: false,

        allowedRoles: ["ROLE_MANAGER", "ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

      {

        name: "Annonces d'équipe",

        path: "/employees/announcements",

        pro: false,

        allowedRoles: ["ROLE_MANAGER", "ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

    ],

  },

  {

    icon: <UserIcon />,

    name: "Gestion Utilisateurs",

    allowedRoles: ["ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

    subItems: [

      {

        name: "Liste Utilisateurs",

        path: "/users",

        pro: false,

        allowedRoles: ["ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

      {

        name: "Profils",

        path: "/users/profiles",

        pro: false,

        allowedRoles: ["ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

      {

        name: "Rles & Permissions",

        path: "/users/roles",

        pro: false,

        allowedRoles: ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

      {

        name: "Documents",

        path: "/users/documents",

        pro: false,

        allowedRoles: ["ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

    ],

  },

  {

    icon: <GroupIcon />,

    name: "Organisation",

    allowedRoles: ["ROLE_MANAGER", "ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

    subItems: [

      {

        name: "Dpartements",

        path: "/departments",

        pro: false,

        allowedRoles: ["ROLE_MANAGER", "ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

      {

        name: "Postes",

        path: "/positions",

        pro: false,

        allowedRoles: ["ROLE_MANAGER", "ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

      {

        name: "Contrats",

        path: "/contracts",

        pro: false,

        allowedRoles: ["ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

      {

        name: "Annonces",

        path: "/announcements",

        pro: false,

        allowedRoles: ["ROLE_MANAGER", "ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

    ],

  },

  {

    icon: <CalenderIcon />,

    name: "Congs & Absences",

    allowedRoles: ["ROLE_MANAGER", "ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

    subItems: [

      {
        name: "Mes Congés",
        path: "/leaves/my-leaves",
        pro: false,
      },

      {
        name: "Tous les Congés",
        path: "/leaves/all",
        pro: false,
        allowedRoles: ["ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
      },

      {
        name: "Quotas de Congés",
        path: "/leaves/types",
        pro: false,
        allowedRoles: ["ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
      },

      {
        name: "Soldes de Congés",
        path: "/leaves/balances",
        pro: false,
        allowedRoles: ["ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
      },

      {

        name: "Validation des Congs",

        path: "/leaves/review",

        pro: false,

        allowedRoles: ["ROLE_MANAGER", "ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

      {

        name: "Calendrier",

        path: "/calendar",

        pro: false,

        allowedRoles: ["ROLE_MANAGER", "ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

    ],

  },

  {

    icon: <TaskIcon />,

    name: "Projets & Tâches",

    subItems: [

      {

        name: "Mes Projets",

        path: "/employees/projects",

        pro: false,

      },

      {

        name: "Mes Tâches",

        path: "/employees/tasks",

        pro: false,

      },

      {

        name: "Tous les Projets",

        path: "/projects",

        pro: false,

        allowedRoles: ["ROLE_MANAGER", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

      {

        name: "Toutes les Tâches",

        path: "/tasks",

        pro: false,

        allowedRoles: ["ROLE_MANAGER", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

      {

        name: "Tableaux Kanban",

        path: "/task-boards",

        pro: false,

        allowedRoles: ["ROLE_MANAGER", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

      {

        name: "Membres Projets",

        path: "/project-members",

        pro: false,

        allowedRoles: ["ROLE_MANAGER", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

    ],

  },

];



const advancedNavItems: NavItem[] = [

  {

    icon: <DollarLineIcon />,

    name: "Finances & Paie",

    allowedRoles: ["ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

    subItems: [

      {

        name: "Informations Financires",

        path: "/finance/info",

        pro: false,

        allowedRoles: ["ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

      {

        name: "Paiements",

        path: "/finance/payments",

        pro: false,

        allowedRoles: ["ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

      {

        name: "Dpenses",

        path: "/finance/expenses",

        pro: false,

        allowedRoles: ["ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

      {

        name: "Emplois",

        path: "/finance/jobs",

        pro: false,

        allowedRoles: ["ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

    ],

  },

  {

    icon: <ChatIcon />,

    name: "Communication",

    allowedRoles: ["ROLE_MANAGER", "ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

    subItems: [

      {

        name: "Messages",

        path: "/messages",

        pro: false,

        allowedRoles: ["ROLE_MANAGER", "ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

      {

        name: "Conversations",

        path: "/conversations",

        pro: false,

        allowedRoles: ["ROLE_MANAGER", "ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

      {

        name: "vnements Personnels",

        path: "/personal-events",

        pro: false,

        allowedRoles: ["ROLE_MANAGER", "ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

    ],

  },

  {

    icon: <PieChartIcon />,

    name: "Rapports & Analytics",

    allowedRoles: ["ROLE_MANAGER", "ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

    subItems: [

      {

        name: "Tableau de Bord RH",

        path: "/reports/hr",

        pro: false,

        allowedRoles: ["ROLE_MANAGER", "ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

      {

        name: "Statistiques Congs",

        path: "/reports/leave",

        pro: false,

        allowedRoles: ["ROLE_MANAGER", "ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

      {

        name: "Performance Projets",

        path: "/reports/projects",

        pro: false,

        allowedRoles: ["ROLE_MANAGER", "ROLE_RH", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

      },

    ],

  },

  {

    icon: <PlugInIcon />,

    name: "Administration",

    allowedRoles: ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"],

    subItems: [

      {
        name: "Paramètres Application",
        path: "/settings",
        pro: false,
        allowedRoles: ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
      },
      {
        name: "Logs & Audit",
        path: "/admin/logs",
        pro: false,
        allowedRoles: ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
      },

    ],

  },

];



const AppSidebar: React.FC = () => {

  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();

  const pathname = usePathname();

  const { role: userRole, loading: roleLoading } = useUserRole();

  const { settings, getImageUrl } = useAppSettings();

  const isEmployeeOnly = userRole?.role === "ROLE_EMPLOYEE";



  const [openSubmenu, setOpenSubmenu] = useState<{

    type: "main" | "others";

    index: number;

  } | null>(null);

  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(

    {},

  );

  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});



  const isRoleAllowed = useCallback(

    (allowedRoles?: RoleCode[]) => {

      if (!allowedRoles || allowedRoles.length === 0) {

        return true;

      }



      if (!userRole) {

        return false;

      }



      if (userRole.isSuperAdmin) {

        return true;

      }



      return allowedRoles.includes(userRole.role);

    },

    [userRole],

  );



  const filterNavItems = useCallback(

    (items: NavItem[]) =>

      items.reduce<NavItem[]>((visible, item) => {

        if (!isRoleAllowed(item.allowedRoles)) {

          return visible;

        }



        if (item.subItems) {

          const filteredSubItems = item.subItems.filter((sub) =>

            isRoleAllowed(sub.allowedRoles),

          );



          if (filteredSubItems.length === 0) {

            return visible;

          }



          visible.push({

            ...item,

            subItems: filteredSubItems,

          });

          return visible;

        }



        visible.push(item);

        return visible;

      }, []),

    [isRoleAllowed],

  );



  const visibleMainNavItems = useMemo(

    () => filterNavItems(mainNavItems),

    [filterNavItems],

  );



  const visibleAdvancedNavItems = useMemo(

    () => filterNavItems(advancedNavItems),

    [filterNavItems],

  );



  const isActive = useCallback(

    (path: string) => pathname === path,

    [pathname],

  );



  useEffect(() => {

    if (isEmployeeOnly) {

      setOpenSubmenu(null);

      return;

    }



    let submenuMatched = false;

    const menuMap: Record<"main" | "others", NavItem[]> = {

      main: visibleMainNavItems,

      others: visibleAdvancedNavItems,

    };



    (Object.keys(menuMap) as Array<"main" | "others">).forEach((menuType) => {

      menuMap[menuType].forEach((nav, index) => {

        nav.subItems?.forEach((subItem) => {

          if (isActive(subItem.path)) {

            setOpenSubmenu({ type: menuType, index });

            submenuMatched = true;

          }

        });

      });

    });



    if (!submenuMatched) {

      setOpenSubmenu(null);

    }

  }, [isEmployeeOnly, isActive, visibleMainNavItems, visibleAdvancedNavItems]);



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



  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {

    setOpenSubmenu((prev) => {

      if (prev && prev.type === menuType && prev.index === index) {

        return null;

      }

      return { type: menuType, index };

    });

  };



  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (

    <ul className="flex flex-col gap-4">

      {items.map((nav, index) => (

        <li key={`${nav.name}-${index}`}>

          {nav.subItems ? (

            <button

              onClick={() => handleSubmenuToggle(index, menuType)}

              className={`menu-item group ${

                openSubmenu?.type === menuType && openSubmenu?.index === index

                  ? "menu-item-active"

                  : "menu-item-inactive"

              } cursor-pointer ${

                !isExpanded && !isHovered

                  ? "lg:justify-center"

                  : "lg:justify-start"

              }`}

            >

              <span

                className={`${

                  openSubmenu?.type === menuType && openSubmenu?.index === index

                    ? "menu-item-icon-active"

                    : "menu-item-icon-inactive"

                }`}

              >

                {nav.icon}

              </span>

              {(isExpanded || isHovered || isMobileOpen) && (

                <span className="menu-item-text">{nav.name}</span>

              )}

              {(isExpanded || isHovered || isMobileOpen) && (

                <ChevronDownIcon

                  className={`ml-auto h-5 w-5 transition-transform duration-200 ${

                    openSubmenu?.type === menuType &&

                    openSubmenu?.index === index

                      ? "rotate-180 text-brand-500"

                      : ""

                  }`}

                />

              )}

            </button>

          ) : (

            nav.path && (

              <Link

                href={nav.path}

                className={`menu-item group ${

                  isActive(nav.path)

                    ? "menu-item-active"

                    : "menu-item-inactive"

                }`}

              >

                <span

                  className={`${

                    isActive(nav.path)

                      ? "menu-item-icon-active"

                      : "menu-item-icon-inactive"

                  }`}

                >

                  {nav.icon}

                </span>

                {(isExpanded || isHovered || isMobileOpen) && (

                  <span className="menu-item-text">{nav.name}</span>

                )}

              </Link>

            )

          )}

          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (

            <div

              ref={(el) => {

                subMenuRefs.current[`${menuType}-${index}`] = el;

              }}

              className="overflow-hidden transition-all duration-300"

              style={{

                height:

                  openSubmenu?.type === menuType && openSubmenu?.index === index

                    ? `${subMenuHeight[`${menuType}-${index}`]}px`

                    : "0px",

              }}

            >

              <ul className="ml-9 mt-2 space-y-1">

                {nav.subItems.map((subItem) => (

                  <li key={subItem.name}>

                    <Link

                      href={subItem.path}

                      className={`menu-dropdown-item ${

                        isActive(subItem.path)

                          ? "menu-dropdown-item-active"

                          : "menu-dropdown-item-inactive"

                      }`}

                    >

                      {subItem.name}

                      <span className="ml-auto flex items-center gap-1">

                        {subItem.new && (

                          <span

                            className={`menu-dropdown-badge ${

                              isActive(subItem.path)

                                ? "menu-dropdown-badge-active"

                                : "menu-dropdown-badge-inactive"

                            }`}

                          >

                            new

                          </span>

                        )}

                        {subItem.pro && (

                          <span

                            className={`menu-dropdown-badge ${

                              isActive(subItem.path)

                                ? "menu-dropdown-badge-active"

                                : "menu-dropdown-badge-inactive"

                            }`}

                          >

                            pro

                          </span>

                        )}

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

        ${

          isExpanded || isMobileOpen

            ? "w-[290px]"

            : isHovered

            ? "w-[290px]"

            : "w-[90px]"

        }

        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}

        lg:translate-x-0`}

      onMouseEnter={() => !isExpanded && setIsHovered(true)}

      onMouseLeave={() => setIsHovered(false)}

    >

      <div

        className={`py-8 ${

          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"

        } flex`}

      >

        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              {/* Logo dynamique ou fallback */}
              {settings.logo_light ? (
                <img
                  className="dark:hidden h-10 w-auto"
                  src={getImageUrl(settings.logo_light)}
                  alt={settings.app_name || "Logo"}
                />
              ) : (
                <Image
                  className="dark:hidden"
                  src="/images/logo/logo.svg"
                  alt="Logo"
                  width={150}
                  height={40}
                  priority
                  style={{ height: 'auto', width: 'auto' }}
                />
              )}
              {settings.logo_dark ? (
                <img
                  className="hidden dark:block h-10 w-auto"
                  src={getImageUrl(settings.logo_dark)}
                  alt={settings.app_name || "Logo"}
                />
              ) : (
                <Image
                  className="hidden dark:block"
                  src="/images/logo/logo-dark.svg"
                  alt="Logo"
                  width={150}
                  height={40}
                  priority
                  style={{ height: 'auto', width: 'auto' }}
                />
              )}
            </>
          ) : (
            <>
              {settings.favicon ? (
                <img
                  className="h-8 w-8"
                  src={getImageUrl(settings.favicon)}
                  alt={settings.app_name || "Logo"}
                />
              ) : (
                <Image
                  src="/images/logo/logo-icon.svg"
                  alt="Logo"
                  width={32}
                  height={32}
                  style={{ height: 'auto', width: 'auto' }}
                />
              )}
            </>
          )}
        </Link>

      </div>



      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">

        {roleLoading ? (

          <div className="flex flex-1 items-center justify-center py-10 text-sm text-gray-500 dark:text-gray-400">

            Chargement du menu...

          </div>

        ) : !userRole ? (

          <div className="flex flex-1 items-center justify-center py-10 text-sm text-gray-500 dark:text-gray-400">

            Accs non authentifi.

          </div>

        ) : isEmployeeOnly ? (

          <EmployeeNavigation className="pb-10" />

        ) : (

          <>

            <nav className="mb-6">

              <div className="flex flex-col gap-4">

                <div>

                  <h2

                    className={`mb-4 flex text-xs uppercase leading-[20px] text-gray-400 ${

                      !isExpanded && !isHovered

                        ? "lg:justify-center"

                        : "justify-start"

                    }`}

                  >

                    {isExpanded || isHovered || isMobileOpen ? (

                      "Gestion RH"

                    ) : (

                      <HorizontaLDots />

                    )}

                  </h2>

                  {renderMenuItems(visibleMainNavItems, "main")}

                </div>

                <div>

                  <h2

                    className={`mb-4 flex text-xs uppercase leading-[20px] text-gray-400 ${

                      !isExpanded && !isHovered

                        ? "lg:justify-center"

                        : "justify-start"

                    }`}

                  >

                    {isExpanded || isHovered || isMobileOpen ? (

                      "Modules Avancs"

                    ) : (

                      <HorizontaLDots />

                    )}

                  </h2>

                  {renderMenuItems(visibleAdvancedNavItems, "others")}

                </div>

              </div>

            </nav>

            {/* TailAdmin promo widget removed */}

          </>

        )}

      </div>

    </aside>

  );

};



export default AppSidebar;





