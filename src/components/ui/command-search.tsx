"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { employeesService, Employee } from "@/services/employees.service";

// Icons (unchanged...)
const SearchIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
);
// ... keep other icons ...
const FileIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></svg>
);
const PlusIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="M12 5v14" /></svg>
);
const UserIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const SmileIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
);


export function CommandSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (!query) {
      setEmployees([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await employeesService.searchEmployees(query);
        // Handle both array format and paginated format just in case
        const data = Array.isArray(res) ? res : res?.data || [];
        setEmployees(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Search error", e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <Command
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white/90 dark:bg-gray-800/90 shadow-2xl backdrop-blur-md dark:border-gray-700"
        loop
        shouldFilter={false} // We filter via API
      >
        <div className="flex items-center border-b border-gray-100 px-4 dark:border-gray-700">
          <SearchIcon className="mr-2 h-5 w-5 shrink-0 text-gray-400" />
          <Command.Input
            placeholder="Rechercher (Employés, Actions, Pages)..."
            className="flex h-14 w-full rounded-md bg-transparent py-3 text-lg outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white dark:placeholder:text-gray-500"
            value={query}
            onValueChange={setQuery}
          />
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2 scroll-py-2 custom-scrollbar">
          {employees.length === 0 && !query && (
            <div className="py-10 text-center text-sm text-gray-400">
              <SmileIcon className="mx-auto h-10 w-10 mb-2 opacity-50" />
              Tapez pour rechercher...
            </div>
          )}
          {employees.length === 0 && query && (
            <Command.Empty className="py-10 text-center text-sm text-gray-500">
              Aucun résultat.
            </Command.Empty>
          )}

          {employees.length > 0 && (
            <Command.Group heading="Employés" className="px-2 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {employees.map((emp) => (
                <Command.Item
                  key={emp.id}
                  onSelect={() => runCommand(() => router.push(`/employees/${emp.id}`))}
                  className="group flex cursor-pointer select-none items-center rounded-lg px-2 py-3 text-sm text-gray-700 dark:text-gray-200 outline-none hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/20 dark:hover:text-brand-400 data-[selected=true]:bg-brand-50 data-[selected=true]:text-brand-600 dark:data-[selected=true]:bg-brand-500/20 dark:data-[selected=true]:text-brand-400 transition-colors"
                >
                  {emp.profile_photo_url ? (
                    <img src={emp.profile_photo_url} alt="" className="mr-3 h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900 dark:text-brand-300 font-bold">
                      {emp.full_name.charAt(0)}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-medium">{emp.full_name}</span>
                    <span className="text-xs text-gray-400">{emp.position?.title || emp.role}</span>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* Static Actions (Only show if query is empty or matches loosely, but simple logic: always show actions if query is empty OR if we want mixed results. For simplicity, show actions always or filter manually. cmdk filters by default if shouldFilter is true. But we set it false for API search. We need to manually filter static items if query exists? Or just show them at bottom? Let's hide static if query exists for clean API search, or keep them. Let's keep them if query is empty.) */}

          {!query && (
            <>
              <Command.Group heading="Actions Rapides" className="px-2 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                <Command.Item
                  onSelect={() => runCommand(() => router.push('/leaves/create'))}
                  className="group flex cursor-pointer select-none items-center rounded-lg px-2 py-3 text-sm text-gray-700 dark:text-gray-200 outline-none hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/20 dark:hover:text-brand-400 data-[selected=true]:bg-brand-50 data-[selected=true]:text-brand-600 dark:data-[selected=true]:bg-brand-500/20 dark:data-[selected=true]:text-brand-400 transition-colors"
                >
                  <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700/50 group-data-[selected=true]:bg-white dark:group-data-[selected=true]:bg-gray-700">
                    <PlusIcon className="h-4 w-4" />
                  </div>
                  <span>Nouvelle demande de congés</span>
                </Command.Item>
                {/* ... other actions ... */}
              </Command.Group>

              <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-semibold text-gray-400 mt-2 dark:text-gray-500 uppercase tracking-wider">
                <Command.Item
                  onSelect={() => runCommand(() => router.push('/employees'))}
                  className="group flex cursor-pointer select-none items-center rounded-lg px-2 py-3 text-sm text-gray-700 dark:text-gray-200 outline-none hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/20 dark:hover:text-brand-400 data-[selected=true]:bg-brand-50 data-[selected=true]:text-brand-600 dark:data-[selected=true]:bg-brand-500/20 dark:data-[selected=true]:text-brand-400 transition-colors"
                >
                  <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700/50 group-data-[selected=true]:bg-white dark:group-data-[selected=true]:bg-gray-700">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <span>Annuaire Employés</span>
                </Command.Item>
              </Command.Group>
            </>
          )}

        </Command.List>
        <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-2 text-[10px] text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 flex justify-between items-center backdrop-blur-sm">
          <span>Pro-tip: Utilisez les flèches pour naviguer</span>
          <div className="flex gap-2">
            <span className="bg-gray-200/50 px-1.5 py-0.5 rounded dark:bg-gray-700/50">Entrée</span> pour valider
            <span className="bg-gray-200/50 px-1.5 py-0.5 rounded dark:bg-gray-700/50">Esc</span> pour fermer
          </div>
        </div>
      </Command>
    </div>
  );
}
