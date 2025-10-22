"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {
  useDepartment,
  useDepartmentOptions,
  useUpdateDepartment,
} from "@/hooks/useDepartments";
import { useToast } from "@/hooks/useToast";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

type FormState = {
  department_name: string;
  description: string;
  manager_user_id: string;
  parent_department_id: string;
};

const toFormState = (department: any): FormState => ({
  department_name: department.department_name ?? "",
  description: department.description ?? "",
  manager_user_id: department.manager_user_id
    ? String(department.manager_user_id)
    : "",
  parent_department_id: department.parent_department_id
    ? String(department.parent_department_id)
    : "",
});

export default function EditDepartmentPage({
  params,
}: {
  params: { id: string };
}) {
  const departmentId = Number(params.id);
  if (Number.isNaN(departmentId)) {
    notFound();
  }

  const router = useRouter();
  const toast = useToast();

  const { data: departmentResponse, isLoading, isError, error } = useDepartment(departmentId);
  const { data: options, isLoading: optionsLoading } = useDepartmentOptions();
  const updateDepartmentMutation = useUpdateDepartment();

  const department = departmentResponse?.data;

  const parentDepartments = useMemo(
    () => options?.departments?.filter((d) => d.id !== departmentId) ?? [],
    [options, departmentId]
  );
  const managers = useMemo(() => options?.managers ?? [], [options]);

  const [formState, setFormState] = useState<FormState | null>(null);

  useEffect(() => {
    if (department) {
      setFormState(toFormState(department));
    }
  }, [department]);

  useEffect(() => {
    if (isError) {
      const message =
        (error as any)?.response?.data?.message ??
        (error as Error)?.message ??
        "Impossible de charger le departement.";
      toast.error(message);
    }
  }, [isError, error, toast]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState) {
      return;
    }

    updateDepartmentMutation.mutate(
      {
        id: departmentId,
        payload: {
          department_name: formState.department_name.trim(),
          description: formState.description.trim() || undefined,
          manager_user_id: formState.manager_user_id
            ? Number(formState.manager_user_id)
            : undefined,
          parent_department_id: formState.parent_department_id
            ? Number(formState.parent_department_id)
            : undefined,
        },
        },
      {
        onSuccess: () => {
          router.push("/departments");
        },
      }
    );
  };

  if (!isLoading && !department) {
    return notFound();
  }

  let pageContent;

  if (!formState) {
    pageContent = (
      <div>
        <PageBreadcrumb pageTitle="Modifier un departement" />
        <ComponentCard>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Chargement des informations...
          </p>
        </ComponentCard>
      </div>
    );
  } else {
    pageContent = (
      <div>
        <PageBreadcrumb pageTitle={`Modifier - ${department?.department_name ?? ""}`} />

        <ComponentCard title="Informations du departement">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-black dark:text-white">
                  Nom du departement <span className="text-meta-1">*</span>
                </label>
                <input
                  type="text"
                  value={formState.department_name}
                  onChange={(event) =>
                    setFormState((prev) =>
                      prev
                        ? { ...prev, department_name: event.target.value }
                        : prev
                    )
                  }
                  required
                  className="w-full rounded border border-stroke px-5 py-3 text-sm text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                  placeholder="Nom du departement"
                />
              </div>

              <div>
                <label className="mb-2 block text-black dark:text-white">
                  Manager
                </label>
                <select
                  value={formState.manager_user_id}
                  onChange={(event) =>
                    setFormState((prev) =>
                      prev ? { ...prev, manager_user_id: event.target.value } : prev
                    )
                  }
                  className="w-full rounded border border-stroke px-5 py-3 text-sm text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                >
                  <option value="">
                    {optionsLoading ? "Chargement..." : "Aucun"}
                  </option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-black dark:text-white">
                  Departement parent
                </label>
                <select
                  value={formState.parent_department_id}
                  onChange={(event) =>
                    setFormState((prev) =>
                      prev
                        ? { ...prev, parent_department_id: event.target.value }
                        : prev
                    )
                  }
                  className="w-full rounded border border-stroke px-5 py-3 text-sm text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                >
                  <option value="">
                    {optionsLoading ? "Chargement..." : "Aucun (racine)"}
                  </option>
                  {parentDepartments.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.department_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-black dark:text-white">
                Description
              </label>
              <textarea
                rows={4}
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) =>
                    prev ? { ...prev, description: event.target.value } : prev
                  )
                }
                className="w-full rounded border border-stroke px-5 py-3 text-sm text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                placeholder="Decrivez brièvement le role de ce departement..."
              />
            </div>

            <div className="flex justify-end gap-4">
              <Link
                href="/departments"
                className="inline-flex items-center justify-center rounded-md border border-stroke px-6 py-3 text-sm font-medium text-black transition-colors hover:border-primary dark:border-strokedark dark:text-white"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={updateDepartmentMutation.isPending}
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updateDepartmentMutation.isPending
                  ? "Enregistrement..."
                  : "Sauvegarder les modifications"}
              </button>
            </div>
          </form>
        </ComponentCard>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission="departments.edit">
      {pageContent}
    </ProtectedRoute>
  );
}
