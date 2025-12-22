"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDynamicMenus } from "@/hooks/useDynamicMenus";
import { MenuItem } from "@/services/permissions.service";
import { ChevronDownIcon } from "@/icons/index";

interface DynamicSidebarProps {
  isExpanded: boolean;
  isHovered: boolean;
  isMobileOpen: boolean;
}

const SECTION_LABELS: Record<string, string> = {
  main: "Gestion RH",
  advanced: "Modules Avancés",
  hrms: "Modules HRMS",
};

export default function DynamicSidebar({ isExpanded, isHovered, isMobileOpen }: DynamicSidebarProps) {
  const pathname = usePathname();
  const { menusBySection, loading, error } = useDynamicMenus();
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);

  const isActive = useCallback((path: string) => pathname === path, [pathname]);

  // Auto-expand submenu based on current path
  useEffect(() => {
    Object.values(menusBySection).flat().forEach((menu) => {
      if (menu.children) {
        const hasActiveChild = menu.children.some((child) => child.path && isActive(child.path));
        if (hasActiveChild) {
          setOpenSubmenu(menu.id);
        }
      }
    });
  }, [pathname, menusBySection, isActive]);

  const handleSubmenuToggle = (menuId: number) => {
    setOpenSubmenu((prev) => (prev === menuId ? null : menuId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-gray-500">
        Chargement...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3 py-4 text-sm text-red-500">
        Erreur: {error}
      </div>
    );
  }

  const renderMenuItem = (menu: MenuItem) => {
    const hasChildren = menu.children && menu.children.length > 0;
    const isSubmenuOpen = openSubmenu === menu.id;
    const itemIsActive = menu.path ? isActive(menu.path) : false;
    const hasActiveChild = menu.children?.some((child) => child.path && isActive(child.path));

    if (hasChildren) {
      return (
        <li key={menu.id}>
          <button
            onClick={() => handleSubmenuToggle(menu.id)}
            className={`menu-item group w-full ${
              isSubmenuOpen || hasActiveChild ? "menu-item-active" : "menu-item-inactive"
            } cursor-pointer ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
          >
            <span className={`text-xl ${isSubmenuOpen || hasActiveChild ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
              {menu.icon || "📋"}
            </span>
            {(isExpanded || isHovered || isMobileOpen) && (
              <>
                <span className="menu-item-text flex-1 text-left">{menu.name}</span>
                <ChevronDownIcon
                  className={`ml-auto h-5 w-5 transition-transform duration-200 ${
                    isSubmenuOpen ? "rotate-180 text-brand-500" : ""
                  }`}
                />
              </>
            )}
          </button>

          {/* Submenu */}
          {(isExpanded || isHovered || isMobileOpen) && isSubmenuOpen && (
            <ul className="mt-2 space-y-1 pl-4">
              {menu.children?.map((child) => (
                <li key={child.id}>
                  <Link
                    href={child.path || "#"}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                      child.path && isActive(child.path)
                        ? "bg-primary text-white"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <span className="text-base">{child.icon || "📄"}</span>
                    <span>{child.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </li>
      );
    }

    // Menu without children (direct link)
    return (
      <li key={menu.id}>
        <Link
          href={menu.path || "#"}
          className={`menu-item group ${
            itemIsActive ? "menu-item-active" : "menu-item-inactive"
          } ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
        >
          <span className={`text-xl ${itemIsActive ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
            {menu.icon || "📋"}
          </span>
          {(isExpanded || isHovered || isMobileOpen) && (
            <span className="menu-item-text">{menu.name}</span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <nav className="flex flex-col gap-4">
      {Object.entries(SECTION_LABELS).map(([sectionKey, sectionLabel]) => {
        const sectionMenus = menusBySection[sectionKey];
        if (!sectionMenus || sectionMenus.length === 0) return null;

        return (
          <div key={sectionKey}>
            <h2
              className={`mb-4 flex text-xs uppercase leading-[20px] text-gray-400 ${
                !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
              }`}
            >
              {isExpanded || isHovered || isMobileOpen ? sectionLabel : "•••"}
            </h2>
            <ul className="flex flex-col gap-2">
              {sectionMenus.map(renderMenuItem)}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
