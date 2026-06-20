"use client";

import React, { useState, useEffect } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { Search, FileText, Users, Building, Settings, Calendar, LogOut } from "lucide-react";

export const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg border border-transparent hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Search className="w-4 h-4" />
        <span>Rechercher...</span>
        <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-gray-500 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Bouton mobile */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Search className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200">
            <Command
              className="w-full flex flex-col"
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
              }}
            >
              <div className="flex items-center border-b border-gray-100 dark:border-gray-800 px-3">
                <Search className="w-5 h-5 text-gray-400 shrink-0" />
                <Command.Input
                  autoFocus
                  placeholder="Rechercher une page ou action..."
                  className="w-full p-4 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                />
                <button
                  onClick={() => setOpen(false)}
                  className="text-xs text-gray-500 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  ESC
                </button>
              </div>

              <Command.List className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                <Command.Empty className="py-6 text-center text-sm text-gray-500">
                  Aucun résultat trouvé.
                </Command.Empty>

                <Command.Group heading="Navigation" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-gray-500">
                  <Command.Item
                    onSelect={() => handleSelect('/')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 shrink-0">📊</div>
                    Tableau de bord
                  </Command.Item>
                  <Command.Item
                    onSelect={() => handleSelect('/employees')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 shrink-0"><Users className="w-4 h-4" /></div>
                    Employés
                  </Command.Item>
                  <Command.Item
                    onSelect={() => handleSelect('/departments')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 shrink-0"><Building className="w-4 h-4" /></div>
                    Départements
                  </Command.Item>
                  <Command.Item
                    onSelect={() => handleSelect('/leaves')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 shrink-0"><Calendar className="w-4 h-4" /></div>
                    Congés
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Actions" className="mt-4 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-gray-500">
                  <Command.Item
                    onSelect={() => handleSelect('/employees/create')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 shrink-0">+</div>
                    Nouvel employé
                  </Command.Item>
                  <Command.Item
                    onSelect={() => handleSelect('/leaves/my-leaves?new=true')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-green-100 dark:bg-green-900/30 text-green-600 shrink-0">+</div>
                    Demander un congé
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Paramètres" className="mt-4 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-gray-500">
                  <Command.Item
                    onSelect={() => handleSelect('/settings/company')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 shrink-0"><Settings className="w-4 h-4" /></div>
                    Paramètres entreprise
                  </Command.Item>
                  <Command.Item
                    onSelect={() => handleSelect('/settings/roles')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 shrink-0"><FileText className="w-4 h-4" /></div>
                    Rôles & Permissions
                  </Command.Item>
                </Command.Group>
              </Command.List>
            </Command>
          </div>
        </div>
      )}
    </>
  );
};
