"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SearchableSelect from "@/components/common/SearchableSelect";
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
  role_id: string; // ID du rôle personnalisé
  department_id: string;
  position_id: string;
  manager_user_id: string;
  hire_date: string;
  active: "true" | "false";
  send_invitation: boolean;
};

const initialFormState: FormState = {
  username: "",
  full_name: "",
  work_email: "",
  password: "",
  role: "",
  role_id: "",
  department_id: "",
  position_id: "",
  manager_user_id: "",
  hire_date: "",
  active: "true",
  send_invitation: false,
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
    const { name, value, type } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (event.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    console.log("=== DEBUG: handleSubmit START ===");
    console.log("formState:", formState);

    if (!formState.role) {
      toast.error("Veuillez selectionner un role pour l'utilisateur.");
      return;
    }

    const payload: CreateUserDto = {
      username: formState.username.trim(),
      full_name: formState.full_name.trim(),
      role: formState.role,
      active: formState.active === "true",
      send_invitation: formState.send_invitation,
    };

    console.log("DEBUG: send_invitation =", formState.send_invitation);

    if (!formState.send_invitation) {
      if (!formState.password) {
        toast.error("Le mot de passe est requis si l'invitation n'est pas envoyée.");
        return;
      }
      payload.password = formState.password;
    } else {
      console.log("DEBUG: Mode invitation - pas de mot de passe requis");
      // En mode invitation, vérifier que l'email est fourni
      if (!formState.work_email.trim()) {
        toast.error("L'email professionnel est requis pour envoyer une invitation.");
        return;
      }
    }

    // Ajouter role_id si un rôle personnalisé est sélectionné
    if (formState.role_id) {
      payload.role_id = Number(formState.role_id);
    }

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

    console.log("DEBUG: Payload final envoyé au backend:", JSON.stringify(payload, null, 2));
    toast.info("Création de l'utilisateur en cours...");

    createUserMutation.mutate(payload, {
      onSuccess: (data) => {
        console.log("DEBUG: Création réussie!", data);
        if (formState.send_invitation) {
          toast.success("Utilisateur créé ! Un email d'invitation a été envoyé.");
        } else {
          toast.success("Utilisateur créé avec succès !");
        }
        router.push("/users");
      },
      onError: (error: any) => {
        console.error("DEBUG: Erreur lors de la création:", error);
        console.error("DEBUG: Error response:", error?.response?.data);
        const errorMessage = error?.response?.data?.message || error?.message || "Erreur inconnue";
        toast.error(`Erreur: ${errorMessage}`);
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

            <div className="flex items-center space-x-3 mb-6">
              <input
                type="checkbox"
                name="send_invitation"
                id="send_invitation"
                checked={formState.send_invitation}
                onChange={handleInputChange}
                disabled={isFormDisabled || isSubmitting}
                className="h-5 w-5 rounded border-stroke text-primary focus:ring-primary"
              />
              <label htmlFor="send_invitation" className="text-black dark:text-white font-medium cursor-pointer">
                Envoyer un mail d&apos;invitation <span className="text-sm font-normal text-gray-500">(L&apos;utilisateur configurera son propre mot de passe)</span>
              </label>
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

              {!formState.send_invitation && (
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
                    required={!formState.send_invitation}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Role <span className="text-meta-1">*</span>
                </label>
                <select
                  name="role"
                  value={formState.role_id ? `custom_${formState.role_id}` : formState.role}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.startsWith('custom_')) {
                      // C'est un rôle personnalisé
                      setFormState(prev => ({
                        ...prev,
                        role: 'ROLE_EMPLOYEE', // Fallback pour l'ancien système
                        role_id: val.replace('custom_', ''),
                      }));
                    } else {
                      // C'est un rôle enum
                      setFormState(prev => ({
                        ...prev,
                        role: val as UserRole,
                        role_id: '',
                      }));
                    }
                  }}
                  disabled={isFormDisabled || isSubmitting}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-not-allowed disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  required
                >
                  {!roles.length && !adminOptions?.customRoles?.length && <option value="">Aucun rôle disponible</option>}

                  {/* Rôles système (enum) */}
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

                  {/* Rôles personnalisés (table role) */}
                  {adminOptions?.customRoles && adminOptions.customRoles.length > 0 && (
                    <optgroup label="📋 Rôles personnalisés">
                      {adminOptions.customRoles.map((customRole) => (
                        <option key={`custom_${customRole.id}`} value={`custom_${customRole.id}`}>
                          {customRole.icon || '👤'} {customRole.name}
                        </option>
                      ))}
                    </optgroup>
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
                <SearchableSelect
                  name="manager_user_id"
                  value={formState.manager_user_id}
                  onChange={(value) => {
                    setFormState(prev => ({ ...prev, manager_user_id: value }));
                  }}
                  options={(adminOptions?.managers || []).map(m => ({
                    id: m.id,
                    full_name: m.full_name,
                    role: formatUserRole(m.role)
                  }))}
                  placeholder="Rechercher un manager..."
                  emptyMessage="Aucun manager trouvé"
                  disabled={isFormDisabled || isSubmitting}
                />
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
