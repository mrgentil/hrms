"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useEffect } from "react";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useDepartment } from "@/hooks/useDepartments";
import { useToast } from "@/hooks/useToast";
import { useUserRole, hasPermission } from "@/hooks/useUserRole";

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => (
  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
      {label}
    </span>
    <span className="text-sm text-black dark:text-white">
      {value === null || value === undefined || value === ""
        ? "—"
        : value}
    </span>
  </div>
);

export default function DepartmentDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { role: userRole } = useUserRole();
  const canEditDepartment =
    !!userRole && hasPermission(userRole, 'departments.edit');

  const departmentId = Number(params.id);
  if (Number.isNaN(departmentId)) {
    notFound();
  }

  const toast = useToast();
  const { data, isLoading, isError, error } = useDepartment(departmentId);
  const department = data?.data;

  useEffect(() => {
    if (isError) {
      const message =
        (error as any)?.response?.data?.message ??
        (error as Error)?.message ??
        "Impossible de charger le departement.";
      toast.error(message);
    }
  }, [isError, error, toast]);

  if (!isLoading && !department) {
    return notFound();
  }

  if (!department) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Departement" />
        <ComponentCard title="Chargement">
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Chargement des informations...
          </p>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle={`Departement - ${department.name}`} />

      <div className="space-y-6">
        <ComponentCard title="Informations générales">
          <div className="grid grid-cols-1 gap-4">
            {department.company && (
              <InfoRow label="Entreprise" value={department.company.name} />
            )}
            <InfoRow label="Nom" value={department.name} />
            <InfoRow
              label="Manager"
              value={department.manager?.full_name ?? "Non assigne"}
            />
            <InfoRow
              label="Departement parent"
              value={
                department.department?.name ??
                department.parent_department?.name ??
                "Aucun"
              }
            />
            <InfoRow
              label="Postes associes"
              value={department.positions_count ?? 0}
            />
            <InfoRow
              label="Employes"
              value={department.employees_count ?? 0}
            />
            <InfoRow
              label="Cree le"
              value={new Date(department.created_at).toLocaleString()}
            />
            <InfoRow
              label="Mis a jour le"
              value={new Date(department.updated_at).toLocaleString()}
            />
          </div>
        </ComponentCard>

        {department.description && (
          <ComponentCard title="Description">
            <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
              {department.description}
            </p>
          </ComponentCard>
        )}

        {/* Positions & Employees Sections */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Positions Column */}
          <ComponentCard title="Postes du département">
            {department.positions && department.positions.length > 0 ? (
              <div className="flex flex-col gap-4">
                {department.positions.map((pos) => (
                  <div
                    key={pos.id}
                    className="flex flex-col gap-1 border-b border-stroke pb-3 last:border-0 dark:border-strokedark"
                  >
                    <div className="flex justify-between">
                      <span className="font-semibold text-black dark:text-white">
                        {pos.title}
                      </span>
                      {pos.level && (
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-meta-4 dark:text-gray-300">
                          {pos.level}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {pos.users && pos.users.length > 0 ? (
                        <span className="flex flex-wrap gap-1">
                          Occupé par:{" "}
                          {pos.users.map((u) => (
                            <Link
                              key={u.id}
                              href={`/users/${u.id}/edit`}
                              className="text-primary hover:underline"
                            >
                              {u.full_name}
                            </Link>
                          )).reduce((prev, curr) => [prev, ", ", curr] as any)}
                        </span>
                      ) : (
                        <span className="text-orange-500">Vacant</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-4 text-sm text-gray-500">
                Aucun poste défini pour ce département.
              </p>
            )}

            <div className="mt-4">
              <Link
                href={`/positions/create?department_id=${department.id}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                + Créer un poste dans ce département
              </Link>
            </div>
          </ComponentCard>

          {/* Employees Column */}
          <ComponentCard title="Collaborateurs">
            {department.users && department.users.length > 0 ? (
              <div className="flex flex-col gap-3">
                {department.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between border-b border-stroke pb-2 last:border-0 dark:border-strokedark"
                  >
                    <div className="flex items-center gap-3">
                      {user.profile_photo_url ? (
                        <img
                          src={user.profile_photo_url}
                          alt={user.full_name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600 dark:bg-meta-4 dark:text-gray-300">
                          {user.full_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-black dark:text-white">
                          {user.full_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.position?.title ?? "Sans poste"}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/users/${user.id}/edit`}
                      className="text-xs text-primary hover:underline"
                    >
                      Voir
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Aucun collaborateur assigné.
              </p>
            )}
          </ComponentCard>
        </div>

        <ComponentCard title="Actions">
          <div className="flex flex-wrap items-center gap-3">
            {canEditDepartment && (
              <Link
                href={`/departments/${department.id}/edit`}
                className="inline-flex items-center rounded-md bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                Modifier
              </Link>
            )}
            <Link
              href="/departments"
              className="inline-flex items-center rounded-md border border-stroke px-5 py-2 text-sm font-medium text-black transition-colors hover:border-primary dark:border-strokedark dark:text-white"
            >
              Retour a la liste
            </Link>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
