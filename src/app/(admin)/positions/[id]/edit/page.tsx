"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { usePosition, useUpdatePosition } from "@/hooks/usePositions";
import { useToast } from "@/hooks/useToast";
import { departmentService } from "@/services/departmentService";

type FormState = {
  title: string;
  level: string;
  description: string;
  department_id: string;
};

export default function EditPositionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const numericId = Number(id);

  const { data, isLoading } = usePosition(numericId);
  const updatePositionMutation = useUpdatePosition();

  const { data: departmentsResponse } = useQuery({
    queryKey: ["departments", "select"],
    queryFn: () => departmentService.getDepartments({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const departments = useMemo(
    () => departmentsResponse?.data ?? [],
    [departmentsResponse],
  );

  const [formState, setFormState] = useState<FormState>({
    title: "",
    level: "",
    description: "",
    department_id: "",
  });

  useEffect(() => {
    if (data?.data) {
      const position = data.data;
      setFormState({
        title: position.title ?? "",
        level: position.level ?? "",
        description: position.description ?? "",
        department_id: position.department_id ? String(position.department_id) : "",
      });
    }
  }, [data]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    updatePositionMutation.mutate(
      {
        id: numericId,
        payload: {
          title: formState.title.trim(),
          level: formState.level.trim() || undefined,
          description: formState.description.trim() || undefined,
          department_id: formState.department_id
            ? Number(formState.department_id)
            : undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Poste mis a jour avec succes !");
          router.push("/positions");
        },
      },
    );
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Modifier un poste" />

      <ComponentCard title="Informations du poste">
        {isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Chargement des informations...
          </p>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-black dark:text-white">
                  Titre du poste <span className="text-meta-1">*</span>
                </label>
                <input
                  type="text"
                  value={formState.title}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  required
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                  placeholder="Ex: Developpeur Full Stack"
                />
              </div>

              <div>
                <label className="mb-2 block text-black dark:text-white">
                  Niveau
                </label>
                <input
                  type="text"
                  value={formState.level}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      level: event.target.value,
                    }))
                  }
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                  placeholder="Junior, Senior, Manager..."
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-black dark:text-white">
                Departement
              </label>
              <select
                value={formState.department_id}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    department_id: event.target.value,
                  }))
                }
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              >
                <option value="">Aucun</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.department_name}
                  </option>
                ))}
              </select>
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
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                placeholder="Resume des responsabilites du poste"
              />
            </div>

            <div className="flex justify-end gap-4">
              <Link
                href="/positions"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-boxdark dark:text-gray-300"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={updatePositionMutation.isPending}
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updatePositionMutation.isPending
                  ? "Enregistrement..."
                  : "Enregistrer"}
              </button>
            </div>
          </form>
        )}
      </ComponentCard>
    </div>
  );
}
