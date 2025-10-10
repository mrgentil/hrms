"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { PermissionsCatalog, rolesService } from "@/lib/roles";
import { useToast } from "@/hooks/useToast";

const DEFAULT_COLOR = "#2563eb";

const capitalizeWords = (value: string) =>
  value
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const extractCategoryKey = (permissionCode: string) => {
  const [category] = permissionCode.split(".");
  return category || "autres";
};

export default function CreateRole() {
  const router = useRouter();
  const toast = useToast();

  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [icon, setIcon] = useState("");
  const [catalog, setCatalog] = useState<PermissionsCatalog | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  const selectedPermissionsArray = useMemo(
    () => Array.from(selectedPermissions),
    [selectedPermissions]
  );

  const isFormValid = roleName.trim().length >= 2 && selectedPermissions.size > 0;

  const loadPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const data = await rolesService.getAvailablePermissions();
      setCatalog(data);
    } catch (error: any) {
      setFetchError(error.message || "Impossible de charger les permissions disponibles.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const groupedPermissions = useMemo(() => {
    if (!catalog) {
      return [];
    }

    const groups: Record<
      string,
      {
        label: string;
        permissions: Array<{ key: string; code: string; label: string }>;
      }
    > = {};

    Object.entries(catalog.permissions).forEach(([key, code]) => {
      const categoryKey = extractCategoryKey(code);
      if (!groups[categoryKey]) {
        groups[categoryKey] = {
          label: catalog.categories?.[categoryKey] || capitalizeWords(categoryKey),
          permissions: [],
        };
      }

      groups[categoryKey].permissions.push({
        key,
        code,
        label: capitalizeWords(key),
      });
    });

    return Object.entries(groups)
      .sort((a, b) => a[1].label.localeCompare(b[1].label))
      .map(([categoryKey, group]) => ({
        categoryKey,
        label: group.label,
        permissions: group.permissions.sort((a, b) => a.label.localeCompare(b.label)),
      }));
  }, [catalog]);

  const togglePermission = (permissionCode: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permissionCode)) {
        next.delete(permissionCode);
      } else {
        next.add(permissionCode);
      }
      return next;
    });
  };

  const toggleCategory = (permissionCodes: string[]) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      const isFullySelected = permissionCodes.every((code) => next.has(code));

      permissionCodes.forEach((code) => {
        if (isFullySelected) {
          next.delete(code);
        } else {
          next.add(code);
        }
      });

      return next;
    });
  };

  const handlePreview = () => {
    if (!isFormValid) {
      toast.error("Complétez le nom du rôle et sélectionnez au moins une permission.");
      return;
    }
    setIsPreviewVisible(true);
  };

  const handleCreateRole = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      toast.error("Complétez le nom du rôle et sélectionnez au moins une permission.");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Création du rôle en cours...");

    try {
      await rolesService.createRole({
        name: roleName.trim(),
        description: description.trim(),
        permissions: selectedPermissionsArray,
        color: color.trim() || undefined,
        icon: icon.trim() || undefined,
      });

      toast.dismiss(loadingToast);
      toast.success("Rôle créé avec succès !");
      setIsPreviewVisible(false);
      router.push("/users/roles");
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || "Impossible de créer le rôle.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Créer Nouveau Rôle" />
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Créer Nouveau Rôle" />
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-700/40 dark:bg-red-900/20 dark:text-red-200">
          <p className="font-medium">Impossible de charger les permissions.</p>
          <p className="mt-2 text-sm">{fetchError}</p>
          <button
            onClick={loadPermissions}
            className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Créer Nouveau Rôle" />

      <form id="create-role-form" className="space-y-6" onSubmit={handleCreateRole}>
        <ComponentCard title="Informations du Rôle">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Nom du rôle <span className="text-meta-1">*</span>
                </label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(event) => setRoleName(event.target.value)}
                  placeholder="Ex: Super Administrateur"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  required
                  minLength={2}
                />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Couleur (badge)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    className="h-11 w-16 cursor-pointer rounded border border-stroke dark:border-form-strokedark"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    placeholder="#2563eb"
                    className="flex-1 rounded border-[1.5px] border-stroke bg-transparent px-4 py-2 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2.5 block text-black dark:text-white">
                  Description <span className="text-meta-1">*</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Décrivez les responsabilités associées à ce rôle..."
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2.5 block text-black dark:text-white">Icône</label>
                <input
                  type="text"
                  value={icon}
                  onChange={(event) => setIcon(event.target.value)}
                  placeholder="Emoji ou icône (ex: 👑)"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-3 rounded-md border border-dashed border-stroke px-4 py-3 dark:border-form-strokedark">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Aperçu
                  </span>
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-xl"
                    style={{ backgroundColor: color || DEFAULT_COLOR }}
                  >
                    {icon || "👤"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Permissions du Rôle">
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Sélectionnez les permissions que ce rôle aura dans le système. Vous pouvez choisir
            permission par permission ou par groupe.
          </p>

          <div className="space-y-6">
            {groupedPermissions.map(({ categoryKey, label, permissions }) => {
              const codes = permissions.map((permission) => permission.code);
              const isCategorySelected = codes.every((code) => selectedPermissions.has(code));
              const isCategoryPartiallySelected =
                !isCategorySelected && codes.some((code) => selectedPermissions.has(code));

              return (
                <div key={categoryKey} className="rounded-lg border border-stroke p-4 dark:border-strokedark">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-black dark:text-white">{label}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {permissions.length} permission{permissions.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCategory(codes)}
                      className="inline-flex items-center rounded-md border border-primary px-3 py-1 text-sm font-medium text-primary hover:bg-primary hover:text-white transition-colors"
                    >
                      {isCategorySelected ? "Tout retirer" : "Tout sélectionner"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {permissions.map(({ key, code, label: permissionLabel }) => (
                      <label
                        key={code}
                        className="flex cursor-pointer items-start space-x-3 rounded-md border border-transparent px-3 py-2 transition hover:border-primary dark:hover:border-primary"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.has(code)}
                          onChange={() => togglePermission(code)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <div>
                          <span className="font-medium text-black dark:text-white">
                            {capitalizeWords(permissionLabel)}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{code}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {isCategoryPartiallySelected && (
                    <p className="mt-3 text-xs text-primary">
                      Sélection partielle : utilisez le bouton pour tout cocher ou décocher.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </ComponentCard>

        <ComponentCard title="Aperçu du Rôle">
          <div className="rounded-sm border border-dashed border-primary/40 bg-primary/5 p-4 dark:border-primary/60 dark:bg-primary/10">
            <h4 className="mb-2 font-medium text-black dark:text-white">
              {roleName ? `Rôle : ${roleName}` : "Commencez à remplir le formulaire"}
            </h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>
                • Description :{" "}
                {description ? description : "Ajoutez une description pour détailler ce rôle."}
              </li>
              <li>
                • Permissions sélectionnées : {selectedPermissionsArray.length} permission
                {selectedPermissionsArray.length > 1 ? "s" : ""}
              </li>
              {selectedPermissionsArray.length > 0 && (
                <li className="pt-2">
                  <div className="flex flex-wrap gap-2">
                    {selectedPermissionsArray.map((permission) => (
                      <span
                        key={permission}
                        className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary dark:bg-primary/20"
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </li>
              )}
              <li>• Couleur sélectionnée : {color || DEFAULT_COLOR}</li>
              <li>• Icône : {icon || "👤 (par défaut)"}</li>
            </ul>
          </div>
        </ComponentCard>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push("/users/roles")}
            className="inline-flex items-center justify-center rounded-md border border-stroke px-10 py-4 text-center font-medium text-black hover:border-gray-3 dark:border-strokedark dark:text-white lg:px-8 xl:px-10"
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handlePreview}
            className="inline-flex items-center justify-center rounded-md border border-primary px-10 py-4 text-center font-medium text-primary hover:bg-primary hover:text-white transition-colors lg:px-8 xl:px-10"
            disabled={isSubmitting}
          >
            Prévisualiser
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-md bg-primary px-10 py-4 text-center font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 transition-colors lg:px-8 xl:px-10"
          >
            {isSubmitting ? "Création..." : "Créer Rôle"}
          </button>
        </div>
      </form>

      {isPreviewVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl dark:bg-boxdark">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-black dark:text-white">Prévisualisation</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Vérifiez les informations avant de créer le rôle.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewVisible(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Fermer la prévisualisation"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-2xl text-white"
                  style={{ backgroundColor: color || DEFAULT_COLOR }}
                >
                  {icon || "👤"}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-black dark:text-white">{roleName}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
                </div>
              </div>

              <div>
                <h5 className="mb-2 font-medium text-black dark:text-white">Permissions :</h5>
                {selectedPermissionsArray.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Aucune permission sélectionnée pour le moment.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {selectedPermissionsArray.map((permission) => (
                      <div
                        key={permission}
                        className="rounded-md border border-stroke px-3 py-2 text-sm dark:border-form-strokedark"
                      >
                        {permission}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsPreviewVisible(false)}
                className="rounded-md border border-stroke px-4 py-2 text-sm font-medium text-black hover:border-gray-3 dark:border-strokedark dark:text-white"
              >
                Fermer
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  const form = document.getElementById('create-role-form') as HTMLFormElement | null;
                  form?.requestSubmit();
                }}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Confirmer la création
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
