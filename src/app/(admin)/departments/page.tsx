"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import ComponentCard from '@/components/common/ComponentCard';
import Pagination from '@/components/common/Pagination';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { useToast } from '@/hooks/useToast';
import { useUserRole, hasPermission } from '@/hooks/useUserRole';
import {
  useDeleteDepartment,
  useDepartments,
} from '@/hooks/useDepartments';

export default function DepartmentsPage() {
  const toast = useToast();
  const { role: userRole } = useUserRole();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useDepartments({
    page: currentPage,
    limit: 10,
    search: searchTerm || undefined,
  });

  const deleteDepartmentMutation = useDeleteDepartment();

  const departments = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalDepartments = data?.total ?? 0;

  const canCreateDepartment =
    !!userRole && hasPermission(userRole, 'departments.create');
  const canEditDepartment =
    !!userRole && hasPermission(userRole, 'departments.edit');
  const canDeleteDepartment =
    !!userRole && hasPermission(userRole, 'departments.delete');

  const { totalEmployees, totalPositions, managedDepartments } = useMemo(() => {
    return departments.reduce(
      (acc, department) => {
        acc.totalEmployees += department.employees_count ?? 0;
        acc.totalPositions += department.positions_count ?? 0;
        if (department.manager) {
          acc.managedDepartments += 1;
        }
        return acc;
      },
      { totalEmployees: 0, totalPositions: 0, managedDepartments: 0 }
    );
  }, [departments]);

  useEffect(() => {
    if (isError) {
      const message =
        (error as any)?.response?.data?.message ??
        (error as Error)?.message ??
        "Impossible de charger les departements. Verifiez que le serveur NestJS est demarre.";
      toast.error(message);
    }
  }, [error, isError, toast]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleDelete = (id: number, name: string) => {
    if (!canDeleteDepartment) {
      toast.error('Permissions insuffisantes pour supprimer un departement.');
      return;
    }

    if (
      !confirm(
        `Etes-vous sur de vouloir supprimer le departement "${name}" ? Cette action est irreversible.`
      )
    ) {
      return;
    }

    deleteDepartmentMutation.mutate(id);
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Gestion des departements" />

      <div className="space-y-6">
        <ComponentCard title="Actions rapides">
          <div className="flex flex-wrap items-center gap-4">
            {canCreateDepartment && (
              <Link
                href="/departments/create"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Nouveau departement
              </Link>
            )}
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center justify-center rounded-md border border-stroke px-6 py-3 text-sm font-medium text-black transition-colors hover:border-primary hover:text-primary dark:border-strokedark dark:text-white"
              disabled={isFetching}
            >
              {isFetching ? 'Actualisation...' : 'Actualiser'}
            </button>
            <div className="ml-auto w-full max-w-xs">
              <input
                type="search"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Rechercher un departement..."
                className="w-full rounded border border-stroke px-4 py-2 text-sm outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              />
            </div>
          </div>
        </ComponentCard>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ComponentCard title="Total departements">
            <p className="text-2xl font-semibold text-black dark:text-white">
              {totalDepartments}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Nombre total enregistre dans le systeme
            </p>
          </ComponentCard>

          <ComponentCard title="Departements avec manager">
            <p className="text-2xl font-semibold text-black dark:text-white">
              {managedDepartments}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Managers assignes sur la page courante
            </p>
          </ComponentCard>

          <ComponentCard title="Employes (page courante)">
            <p className="text-2xl font-semibold text-black dark:text-white">
              {totalEmployees}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Somme des effectifs affiches
            </p>
          </ComponentCard>

          <ComponentCard title="Postes (page courante)">
            <p className="text-2xl font-semibold text-black dark:text-white">
              {totalPositions}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Postes associes aux departements listes
            </p>
          </ComponentCard>
        </div>

        <ComponentCard title="Liste des departements">
          {isLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Chargement des departements...
            </p>
          ) : departments.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Aucun departement trouve. Ajoutez un departement pour commencer.
            </p>
          ) : (
            <div className="max-w-full overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-2 text-left text-sm dark:bg-meta-4">
                    <th className="min-w-[220px] px-4 py-3 font-medium text-black dark:text-white xl:pl-11">
                      Departement
                    </th>
                    <th className="min-w-[180px] px-4 py-3 font-medium text-black dark:text-white">
                      Manager
                    </th>
                    <th className="min-w-[120px] px-4 py-3 font-medium text-black dark:text-white">
                      Postes
                    </th>
                    <th className="min-w-[120px] px-4 py-3 font-medium text-black dark:text-white">
                      Employes
                    </th>
                    <th className="px-4 py-3 font-medium text-black dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((department) => (
                    <tr key={department.id} className="text-sm">
                      <td className="border-b border-[#eee] px-4 py-4 pl-9 dark:border-strokedark xl:pl-11">
                        <div>
                          <h5 className="font-semibold text-black dark:text-white">
                            {department.name || <span className="italic text-gray-500">Sans nom (ID: {department.id})</span>}
                          </h5>
                          {department.description && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {department.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="border-b border-[#eee] px-4 py-4 dark:border-strokedark">
                        {department.manager ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                            <span className="text-base">??</span>
                            {department.manager.full_name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Non assigne
                          </span>
                        )}
                      </td>
                      <td className="border-b border-[#eee] px-4 py-4 dark:border-strokedark">
                        <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          {department.positions_count ?? 0}
                        </span>
                      </td>
                      <td className="border-b border-[#eee] px-4 py-4 dark:border-strokedark">
                        <span className="inline-flex rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                          {department.employees_count ?? 0}
                        </span>
                      </td>
                      <td className="border-b border-[#eee] px-4 py-4 dark:border-strokedark">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/departments/${department.id}`}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Voir
                          </Link>
                          {canEditDepartment && (
                            <Link
                              href={`/departments/${department.id}/edit`}
                              className="text-xs font-medium text-blue-500 hover:underline"
                            >
                              Modifier
                            </Link>
                          )}
                          {canDeleteDepartment && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  department.id,
                                  department.name,
                                )
                              }
                              className="text-xs font-medium text-danger hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={deleteDepartmentMutation.isPending}
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="mt-6 border-t-0 pt-0"
          />
        </ComponentCard>
      </div>
    </div>
  );
}
