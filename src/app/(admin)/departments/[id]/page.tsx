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
        <ComponentCard title="Informations generales">
          <div className="grid grid-cols-1 gap-4">
            <InfoRow label="Nom" value={department.name} />
            <InfoRow
              label="Manager"
              value={department.manager?.full_name ?? "Non assigne"}
            />
            <InfoRow
              label="Departement parent"
              value={
                department.parent_department
                  ? department.parent_department.name
                  : "Aucun"
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
