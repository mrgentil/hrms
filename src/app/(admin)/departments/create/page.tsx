"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {
  useCreateDepartment,
  useDepartmentOptions,
} from "@/hooks/useDepartments";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

type FormState = {
  name: string;
  description: string;
  manager_user_id: string;
  parent_department_id: string;
};

const initialState: FormState = {
  name: "",
  description: "",
  manager_user_id: "",
  parent_department_id: "",
};

export default function CreateDepartmentPage() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(initialState);

  const { data: options, isLoading: optionsLoading } = useDepartmentOptions();
  const createDepartmentMutation = useCreateDepartment();

  const parentDepartments = useMemo(
    () => options?.departments ?? [],
    [options]
  );
  const managers = useMemo(() => options?.managers ?? [], [options]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    createDepartmentMutation.mutate(
      {
        name: formState.name.trim(),
        description: formState.description.trim() || undefined,
        manager_user_id: formState.manager_user_id
          ? Number(formState.manager_user_id)
          : undefined,
        parent_department_id: formState.parent_department_id
          ? Number(formState.parent_department_id)
          : undefined,
      },
      {
        onSuccess: () => {
          router.push("/departments");
        },
      }
    );
  };

  return (
    <ProtectedRoute permission="departments.create">
      <div>
        <PageBreadcrumb pageTitle="Creer un departement" />

        <ComponentCard title="Informations du departement">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-black dark:text-white">
                  Nom du departement <span className="text-meta-1">*</span>
                </label>
                <input
                  type="text"
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  required
                  className="w-full rounded border border-stroke px-5 py-3 text-sm text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                  placeholder="Ex : Ressources Humaines"
                />
              </div>

              <div>
                <label className="mb-2 block text-black dark:text-white">
                  Manager
                </label>
                <select
                  value={formState.manager_user_id}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      manager_user_id: event.target.value,
                    }))
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
                    setFormState((prev) => ({
                      ...prev,
                      parent_department_id: event.target.value,
                    }))
                  }
                  className="w-full rounded border border-stroke px-5 py-3 text-sm text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                >
                  <option value="">
                    {optionsLoading ? "Chargement..." : "Aucun (racine)"}
                  </option>
                  {parentDepartments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name || `Sans nom (ID: ${department.id})`}
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
                  setFormState((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
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
                disabled={createDepartmentMutation.isPending}
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createDepartmentMutation.isPending
                  ? "Creation..."
                  : "Creer le departement"}
              </button>
            </div>
          </form>
        </ComponentCard>
      </div>
    </ProtectedRoute>
  );
}
