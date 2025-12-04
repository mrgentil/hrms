"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useToast } from "@/hooks/useToast";
import { useCreateUser, useUserAdminOptions } from "@/hooks/useUsers";
import { CreateUserDto, UserRole } from "@/types/api";
import { formatUserRole, ROLE_CATEGORIES, sortRolesByHierarchy, getRoleEmoji } from "@/lib/roleLabels";

type FormState = {
  username: string;
  full_name: string;
  work_email: string;
  password: string;
  role: UserRole | "";
  department_id: string;
  position_id: string;
  manager_user_id: string;
  hire_date: string;
  active: "true" | "false";
};

const initialFormState: FormState = {
  username: "",
  full_name: "",
  work_email: "",
  password: "",
  role: "",
  department_id: "",
  position_id: "",
  manager_user_id: "",
  hire_date: "",
  active: "true",
};

export default function CreateUser() {
  const router = useRouter();
  const toast = useToast();
  const [formState, setFormState] = useState<FormState>(initialFormState);

  const {
    data: adminOptionsResponse,
    isLoading: adminOptionsLoading,
    isError: adminOptionsError,
  } = useUserAdminOptions();

  const adminOptions = adminOptionsResponse?.data;
  const createUserMutation = useCreateUser();

  useEffect(() => {
    if (adminOptions?.roles?.length) {
      setFormState((prev) => ({
        ...prev,
        role: prev.role || adminOptions.roles[0],
      }));
    }
  }, [adminOptions]);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.role) {
      toast.error("Veuillez selectionner un role pour l'utilisateur.");
      return;
    }

    const payload: CreateUserDto = {
      username: formState.username.trim(),
      full_name: formState.full_name.trim(),
      password: formState.password,
      role: formState.role,
      active: formState.active === "true",
    };

    if (formState.work_email.trim()) {
      payload.work_email = formState.work_email.trim();
    }
    if (formState.department_id) {
      payload.department_id = Number(formState.department_id);
    }
    if (formState.position_id) {
      payload.position_id = Number(formState.position_id);
    }
    if (formState.manager_user_id) {
      payload.manager_user_id = Number(formState.manager_user_id);
    }
    if (formState.hire_date) {
      payload.hire_date = new Date(formState.hire_date).toISOString();
    }

    createUserMutation.mutate(payload, {
      onSuccess: () => {
        router.push("/users");
      },
    });
  };

  const handleDraft = () => {
    toast.info("Brouillon sauvegarde !");
  };

  const isSubmitting = createUserMutation.isPending;
  const roles = adminOptions?.roles ?? [];
  const isFormDisabled = adminOptionsLoading || !roles.length;

  return (
    <div>
      <PageBreadcrumb pageTitle="Creer un utilisateur" />

      <div className="space-y-6">
        {adminOptionsError && (
          <ComponentCard title="Chargement des donnees" className="border border-red-300 bg-red-50">
            <p className="text-sm text-red-600">
              Impossible de recuperer les options necessaires. Veuillez reessayer plus tard.
            </p>
          </ComponentCard>
        )}
        {adminOptionsLoading && (
          <ComponentCard title="Chargement">
            <p className="text-sm text-gray-600 dark:text-gray-300">Preparation du formulaire...</p>
          </ComponentCard>
        )}

        <ComponentCard title="Informations de base">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Nom d&apos;utilisateur <span className="text-meta-1">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  placeholder="Entrez le nom d'utilisateur"
                  value={formState.username}
                  onChange={handleInputChange}
                  disabled={isFormDisabled || isSubmitting}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-not-allowed disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Nom complet <span className="text-meta-1">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  placeholder="Entrez le nom complet"
                  value={formState.full_name}
                  onChange={handleInputChange}
                  disabled={isFormDisabled || isSubmitting}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-not-allowed disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Email professionnel
                </label>
                <input
                  type="email"
                  name="work_email"
                  placeholder="email@company.com"
                  value={formState.work_email}
                  onChange={handleInputChange}
                  disabled={isFormDisabled || isSubmitting}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-not-allowed disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Mot de passe <span className="text-meta-1">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Entrez le mot de passe"
                  value={formState.password}
                  onChange={handleInputChange}
                  disabled={isFormDisabled || isSubmitting}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-not-allowed disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Role <span className="text-meta-1">*</span>
                </label>
                <select
                  name="role"
                  value={formState.role}
                  onChange={handleInputChange}
                  disabled={isFormDisabled || isSubmitting}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-not-allowed disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  required
                >
                  {!roles.length && <option value="">Aucun rôle disponible</option>}
                  {roles.length > 0 && (
                    <>
                      {Object.entries(ROLE_CATEGORIES).map(([key, category]) => {
                        const availableRoles = category.roles.filter(r => roles.includes(r));
                        if (availableRoles.length === 0) return null;
                        return (
                          <optgroup key={key} label={category.label}>
                            {availableRoles.map((role) => (
                              <option key={role} value={role}>
                                {getRoleEmoji(role)} {formatUserRole(role)}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Departement
                </label>
                <select
                  name="department_id"
                  value={formState.department_id}
                  onChange={handleInputChange}
                  disabled={isFormDisabled || isSubmitting}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-not-allowed disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                >
                  <option value="">Aucun</option>
                  {adminOptions?.departments?.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.department_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Poste
                </label>
                <select
                  name="position_id"
                  value={formState.position_id}
                  onChange={handleInputChange}
                  disabled={isFormDisabled || isSubmitting}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-not-allowed disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                >
                  <option value="">Aucun</option>
                  {adminOptions?.positions?.map((position) => (
                    <option key={position.id} value={position.id}>
                      {position.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Manager
                </label>
                <select
                  name="manager_user_id"
                  value={formState.manager_user_id}
                  onChange={handleInputChange}
                  disabled={isFormDisabled || isSubmitting}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-not-allowed disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                >
                  <option value="">Aucun</option>
                  {adminOptions?.managers?.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.full_name} ({formatUserRole(manager.role)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Date d&apos;embauche
                </label>
                <input
                  type="date"
                  name="hire_date"
                  value={formState.hire_date}
                  onChange={handleInputChange}
                  disabled={isFormDisabled || isSubmitting}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-not-allowed disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Statut actif
                </label>
                <select
                  name="active"
                  value={formState.active}
                  onChange={handleInputChange}
                  disabled={isFormDisabled || isSubmitting}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-not-allowed disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                >
                  <option value="true">Actif</option>
                  <option value="false">Inactif</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push("/users")}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-10 py-4 text-center font-medium text-gray-700 hover:bg-gray-50 dark:bg-boxdark dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors lg:px-8 xl:px-10"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDraft}
                className="inline-flex items-center justify-center rounded-md border-2 border-primary bg-white px-10 py-4 text-center font-medium text-primary hover:bg-primary hover:text-white dark:bg-boxdark transition-colors lg:px-8 xl:px-10 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
              >
                Enregistrer comme brouillon
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isFormDisabled}
                className="inline-flex items-center justify-center rounded-md bg-primary px-10 py-4 text-center font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 transition-colors lg:px-8 xl:px-10"
              >
                {isSubmitting ? "Creation..." : "Creer l'utilisateur"}
              </button>
            </div>
          </form>
        </ComponentCard>
      </div>
    </div>
  );
}
