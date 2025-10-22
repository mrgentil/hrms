"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useDeletePosition, usePositions } from "@/hooks/usePositions";
import { useToast } from "@/hooks/useToast";
import { useUserRole, hasPermission } from "@/hooks/useUserRole";

export default function PositionsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();
  const { role: userRole } = useUserRole();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = usePositions({ page: currentPage, limit: 10 });
  const deletePositionMutation = useDeletePosition();

  const positions = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;

  const canCreatePosition =
    !!userRole && hasPermission(userRole, 'positions.create');
  const canEditPosition =
    !!userRole && hasPermission(userRole, 'positions.edit');
  const canDeletePosition =
    !!userRole && hasPermission(userRole, 'positions.delete');
  const showActionsColumn = canEditPosition || canDeletePosition;

  useEffect(() => {
    if (isError) {
      const message =
        (error as any)?.response?.data?.message ??
        (error as Error)?.message ??
        "Impossible de charger les postes. Verifiez que l'API est demarree.";
      toast.error(message);
    }
  }, [isError, error, toast]);

  const handleDelete = (id: number) => {
    if (!canDeletePosition) {
      toast.error("Permissions insuffisantes pour supprimer un poste.");
      return;
    }

    if (!confirm("Voulez-vous vraiment supprimer ce poste ?")) {
      return;
    }

    deletePositionMutation.mutate(id);
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Gestion des postes" />

      <div className="space-y-6">
        <ComponentCard title="Actions rapides">
          <div className="flex flex-wrap items-center gap-4">
            {canCreatePosition && (
              <Link
                href="/positions/create"
                className="inline-flex items-center justify-center rounded-md bg-primary px-10 py-4 text-center font-medium text-white transition-colors hover:bg-primary/90"
              >
                Creer un poste
              </Link>
            )}
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center justify-center rounded-md border border-stroke px-6 py-3 text-sm font-medium text-black transition-colors hover:border-primary hover:text-primary dark:border-strokedark dark:text-white"
              disabled={isFetching}
            >
              {isFetching ? "Actualisation..." : "Actualiser"}
            </button>
          </div>
        </ComponentCard>

        <ComponentCard title="Liste des postes">
          {isLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Chargement des postes...
            </p>
          ) : positions.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Aucun poste trouve. Ajoutez un poste pour commencer.
            </p>
          ) : (
            <div className="max-w-full overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-2 text-left dark:bg-meta-4">
                    <th className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                      Titre
                    </th>
                    <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                      Niveau
                    </th>
                    <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                      Departement
                    </th>
                    <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                      Employes
                    </th>
                    {showActionsColumn && (
                      <th className="px-4 py-4 font-medium text-black dark:text-white">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position) => (
                    <tr key={position.id}>
                      <td className="border-b border-[#eee] px-4 py-5 pl-9 dark:border-strokedark xl:pl-11">
                        <h5 className="font-medium text-black dark:text-white">
                          {position.title}
                        </h5>
                        {position.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {position.description}
                          </p>
                        )}
                      </td>
                      <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                        {position.level ? (
                          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                            {position.level}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                        <span className="text-sm text-black dark:text-white">
                          {position.department?.department_name ?? "-"}
                        </span>
                      </td>
                      <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                        <span className="inline-flex rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">
                          {position.employees_count ?? 0}
                        </span>
                      </td>
                      {showActionsColumn && (
                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                          <div className="flex items-center gap-3">
                            {canEditPosition && (
                              <Link
                                href={`/positions/${position.id}/edit`}
                                className="text-sm text-primary hover:underline"
                              >
                                Modifier
                              </Link>
                            )}
                            {canDeletePosition && (
                              <button
                                onClick={() => handleDelete(position.id)}
                                className="text-sm text-danger hover:underline"
                                disabled={deletePositionMutation.isPending}
                              >
                                Supprimer
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                className="rounded border border-stroke px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Precedent
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Page {currentPage} sur {totalPages}
              </span>
              <button
                className="rounded border border-stroke px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages}
              >
                Suivant
              </button>
            </div>
          )}
        </ComponentCard>
      </div>
    </div>
  );
}
