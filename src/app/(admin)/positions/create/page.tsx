"use client";

import { FormEvent, useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SearchableSelect from "@/components/common/SearchableSelect";
import { useCreatePosition } from "@/hooks/usePositions";
import { useToast } from "@/hooks/useToast";
import { departmentService } from "@/services/departmentService";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { companiesService, Company } from "@/services/companies.service";
import { useAuth } from "@/contexts/AuthContext";

type FormState = {
  title: string;
  level: string;
  description: string;
  department_id: string;
  company_id: string;
};

const initialState: FormState = {
  title: "",
  level: "",
  description: "",
  department_id: "",
  company_id: "",
};

export default function CreatePositionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const departmentIdParam = searchParams.get("department_id");
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'ROLE_SUPER_ADMIN';

  const toast = useToast();
  const [formState, setFormState] = useState<FormState>({
    ...initialState,
    department_id: departmentIdParam ?? "",
  });

  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    if (isSuperAdmin) {
      companiesService.getAll().then(setCompanies).catch(console.error);
    }
  }, [isSuperAdmin]);

  const createPositionMutation = useCreatePosition();
  const { data: departmentsResponse, isLoading: departmentsLoading } = useQuery({
    queryKey: ["departments", "select"],
    queryFn: () => departmentService.getDepartments({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const departments = useMemo(
    () => departmentsResponse?.data ?? [],
    [departmentsResponse],
  );

  // Options mapping for SearchableSelect
  const companyOptions = useMemo(() =>
    companies.map(c => ({ id: c.id, full_name: c.name })),
    [companies]
  );

  const departmentOptions = useMemo(() =>
    departments.map(d => ({ id: d.id, full_name: d.name })),
    [departments]
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    createPositionMutation.mutate(
      {
        title: formState.title.trim(),
        level: formState.level.trim() || undefined,
        description: formState.description.trim() || undefined,
        department_id: formState.department_id
          ? Number(formState.department_id)
          : undefined,
        company_id: isSuperAdmin && formState.company_id ? Number(formState.company_id) : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Poste cree avec succes !");
          router.push("/positions");
        },
      },
    );
  };

  return (
    <ProtectedRoute permission="positions.create">
      <div>
        <PageBreadcrumb pageTitle="Creer un poste" />

        <ComponentCard title="Informations du poste">
          <form className="space-y-6" onSubmit={handleSubmit}>

            {/* Company Selection Multi-Tenancy Logic */}
            {isSuperAdmin ? (
              <div className="mb-4">
                <label className="mb-2 block text-black dark:text-white">
                  Entreprise <span className="text-meta-1">*</span>
                </label>
                <SearchableSelect
                  options={companyOptions}
                  value={formState.company_id}
                  onChange={(value) => setFormState(prev => ({ ...prev, company_id: value }))}
                  placeholder="Sélectionner une entreprise"
                  className="w-full"
                />
              </div>
            ) : (
              <div className="mb-4">
                <label className="mb-2 block text-black dark:text-white">
                  Entreprise
                </label>
                <input
                  type="text"
                  value={user?.company?.name || "Votre Entreprise"}
                  disabled
                  className="w-full rounded border-[1.5px] border-stroke bg-gray-100 px-5 py-3 text-black opacity-60 outline-none dark:bg-boxdark-2 dark:text-white"
                />
              </div>
            )}

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
              <SearchableSelect
                options={departmentOptions}
                value={formState.department_id}
                onChange={(value) => setFormState(prev => ({ ...prev, department_id: value }))}
                placeholder={departmentsLoading ? "Chargement..." : "Sélectionner un département"}
                className="w-full"
              />
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
                disabled={createPositionMutation.isPending}
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createPositionMutation.isPending
                  ? "Creation..."
                  : "Creer le poste"}
              </button>
            </div>
          </form>
        </ComponentCard>
      </div>
    </ProtectedRoute>
  );
}
