"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useToast } from "@/hooks/useToast";
import { hasPermission, useUserRole } from "@/hooks/useUserRole";
import {
  CreateLeaveTypePayload,
  LeaveType,
  UpdateLeaveTypePayload,
  leavesService,
} from "@/services/leaves.service";

const PREDEFINED_LEAVE_TYPES = [
  { value: 'CongePaye', label: 'Congé Payé' },
  { value: 'Maladie', label: 'Maladie' },
  { value: 'TeleTravail', label: 'TéléTravail' },
  { value: 'Marriage', label: 'Marriage' },
  { value: 'Permission', label: 'Permission' },
  { value: 'Abscence', label: 'Abscence' },
  { value: 'Demenagement', label: 'Déménagement' },
  { value: 'Deces', label: 'Décès' },
] as const;

type DraftValue = {
  annual: string;
  monthly: string;
  requiresApproval: boolean;
};

type DraftMap = Record<number, DraftValue>;

interface CreateFormState {
  typeKey: string;
  description: string;
  annual: string;
  monthly: string;
  requiresApproval: boolean;
}

export default function ManageLeaveTypesPage() {
  const toast = useToast();
  const { role: userRole, loading: roleLoading } = useUserRole();

  const canManage = useMemo(
    () => !!userRole && hasPermission(userRole, "leaves.manage_types"),
    [userRole],
  );

  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingIds, setProcessingIds] = useState<number[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [draftValues, setDraftValues] = useState<DraftMap>({});
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(() => ({
    typeKey: PREDEFINED_LEAVE_TYPES[0]?.value ?? "",
    description: "",
    annual: "",
    monthly: "",
    requiresApproval: true,
  }));

  const syncDraftValues = useCallback(
    (types: LeaveType[], replace = true) => {
      setDraftValues((prev) => {
        const next: DraftMap = replace ? {} : { ...prev };
        types.forEach((type) => {
          next[type.id] = {
            annual: (type.default_allowance ?? 0).toString(),
            monthly:
              type.monthly_allowance === null ||
              type.monthly_allowance === undefined
                ? ""
                : type.monthly_allowance.toString(),
            requiresApproval: type.requires_approval ?? true,
          };
        });
        return next;
      });
    },
    [],
  );

  const mapConfiguredTypeValues = useCallback((types: LeaveType[]) => {
    return types.reduce<string[]>((acc, type) => {
      const option = PREDEFINED_LEAVE_TYPES.find(
        (item) => item.label.toLowerCase() === type.name.toLowerCase(),
      );
      if (option) {
        acc.push(option.value);
      }
      return acc;
    }, []);
  }, []);

  const fetchTypes = useCallback(
    async (withLoader = false) => {
      if (!canManage) {
        setInitialLoading(false);
        return;
      }

      if (withLoader) {
        setInitialLoading(true);
      }

      setIsRefreshing(true);

      try {
        const response = await leavesService.getLeaveTypes();
        if (!response?.success) {
          throw new Error(
            response?.message ?? "Impossible de récupérer les types de congé.",
          );
        }

        const types = ((response.data as LeaveType[]) ?? []).sort((a, b) =>
          a.name.localeCompare(b.name, "fr", { sensitivity: "base" }),
        );
        setLeaveTypes(types);
        syncDraftValues(types);
        // Ajuster le type sélectionné par défaut si nécessaire.
        const configuredValues = mapConfiguredTypeValues(types);
        const firstAvailable =
          PREDEFINED_LEAVE_TYPES.find(
            (option) => !configuredValues.includes(option.value),
          )?.value ?? "";
        setCreateForm((prev) => ({
          ...prev,
          typeKey: firstAvailable,
        }));
      } catch (error) {
        console.error("Erreur lors du chargement des types de congé:", error);
        const message =
          (error as any)?.response?.data?.message ??
          (error as Error)?.message ??
          "Impossible de récupérer les types de congé.";
        toast.error(message);
      } finally {
        setIsRefreshing(false);
        setInitialLoading(false);
      }
    },
    [canManage, syncDraftValues, toast],
  );

  useEffect(() => {
    if (roleLoading) {
      return;
    }

    fetchTypes(true);
  }, [roleLoading, fetchTypes]);

  const configuredTypeValues = useMemo(
    () => mapConfiguredTypeValues(leaveTypes),
    [leaveTypes, mapConfiguredTypeValues],
  );

  const availableTypes = useMemo(
    () =>
      PREDEFINED_LEAVE_TYPES.filter(
        (option) => !configuredTypeValues.includes(option.value),
      ),
    [configuredTypeValues],
  );

  const updateDraft = (
    leaveTypeId: number,
    updater: (value: DraftValue) => DraftValue,
  ) => {
    setDraftValues((prev) => {
      const current = prev[leaveTypeId] ?? {
        annual: "0",
        monthly: "",
        requiresApproval: true,
      };
      return {
        ...prev,
        [leaveTypeId]: updater(current),
      };
    });
  };

  const isProcessing = (leaveTypeId: number) =>
    processingIds.includes(leaveTypeId);

  const hasChanges = (leaveType: LeaveType) => {
    const draft = draftValues[leaveType.id];
    if (!draft) {
      return false;
    }

    const annualValue = Number.parseFloat(draft.annual);
    const monthlyValue =
      draft.monthly.trim().length === 0
        ? null
        : Number.parseFloat(draft.monthly);
    const requiresApproval = draft.requiresApproval;

    if (Number.isNaN(annualValue)) {
      return false;
    }

    const baseAnnual = leaveType.default_allowance ?? 0;
    const baseMonthly =
      leaveType.monthly_allowance === null ||
      leaveType.monthly_allowance === undefined
        ? null
        : leaveType.monthly_allowance;
    const baseRequiresApproval = leaveType.requires_approval ?? true;

    return (
      Math.abs(annualValue - baseAnnual) > 0.0001 ||
      (monthlyValue ?? null) !== baseMonthly ||
      requiresApproval !== baseRequiresApproval
    );
  };

  const resetCreateForm = () =>
    setCreateForm({
      typeKey: PREDEFINED_LEAVE_TYPES[0]?.value ?? "",
      description: "",
      annual: "",
      monthly: "",
      requiresApproval: true,
    });

  const handleCreateSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!canManage || creating) {
      return;
    }

    const selectedType = PREDEFINED_LEAVE_TYPES.find(
      (option) => option.value === createForm.typeKey,
    );
    if (!selectedType) {
      toast.error(
        availableTypes.length === 0
          ? "Tous les types de congé disponibles sont déjà configurés."
          : "Merci de sélectionner un type de congé valide.",
      );
      return;
    }

    const annualRaw = createForm.annual.trim();
    const monthlyRaw = createForm.monthly.trim();

    let annualValue: number | undefined;
    if (annualRaw.length > 0) {
      annualValue = Number.parseFloat(annualRaw);
      if (Number.isNaN(annualValue) || annualValue < 0) {
        toast.error(
          "Le quota annuel doit être un nombre positif (les décimales sont autorisées).",
        );
        return;
      }
    }

    let monthlyValue: number | undefined;
    if (monthlyRaw.length > 0) {
      monthlyValue = Number.parseFloat(monthlyRaw);
      if (Number.isNaN(monthlyValue) || monthlyValue < 0) {
        toast.error(
          "Le quota mensuel doit être un nombre positif (les décimales sont autorisées).",
        );
        return;
      }
    }

    const payload: CreateLeaveTypePayload = {
      name: selectedType.label,
      requires_approval: createForm.requiresApproval,
    };

    const trimmedDescription = createForm.description.trim();
    if (trimmedDescription.length > 0) {
      payload.description = trimmedDescription;
    }

    if (annualValue !== undefined) {
      payload.default_allowance = annualValue;
    }

    if (monthlyValue !== undefined) {
      payload.monthly_allowance = monthlyValue;
    }

    setCreating(true);
    try {
      const response = await leavesService.createLeaveType(payload);
      if (!response?.success) {
        throw new Error(
          response?.message ?? "La création du type de congé a échoué.",
        );
      }

      const created = response.data as LeaveType;
      const updatedList = [...leaveTypes, created].sort((a, b) =>
        a.name.localeCompare(b.name, "fr", { sensitivity: "base" }),
      );
      setLeaveTypes(updatedList);
      syncDraftValues([created], false);
      toast.success(`Type "${created.name}" créé avec succès.`);

      const updatedConfigured = mapConfiguredTypeValues(updatedList);
      const nextAvailable =
        PREDEFINED_LEAVE_TYPES.find(
          (option) => !updatedConfigured.includes(option.value),
        )?.value ?? "";

      setCreateForm({
        typeKey: nextAvailable,
        description: "",
        annual: "",
        monthly: "",
        requiresApproval: true,
      });

      if (!nextAvailable) {
        toast.info(
          "Tous les types de congé prédéfinis ont été configurés. Vous pouvez désormais ajuster leurs quotas plus bas.",
        );
      }
    } catch (error) {
      console.error("Erreur lors de la création d'un type de congé:", error);
      const message =
        (error as any)?.response?.data?.message ??
        (error as Error)?.message ??
        "La création du type de congé a échoué.";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async (leaveType: LeaveType) => {
    const draft = draftValues[leaveType.id];
    if (!draft) {
      return;
    }

    const payload: UpdateLeaveTypePayload = {};

    const annualValue = Number.parseFloat(draft.annual);
    if (Number.isNaN(annualValue) || annualValue < 0) {
      toast.error(
        "Merci d'indiquer un quota annuel positif (les décimales sont autorisées).",
      );
      return;
    }

    if (
      Math.abs(
        annualValue - (leaveType.default_allowance ?? 0),
      ) > 0.0001
    ) {
      payload.default_allowance = annualValue;
    }

    const monthlyRaw = draft.monthly.trim();
    const baseMonthly =
      leaveType.monthly_allowance === null ||
      leaveType.monthly_allowance === undefined
        ? null
        : leaveType.monthly_allowance;

    if (monthlyRaw.length > 0) {
      const monthlyValue = Number.parseFloat(monthlyRaw);
      if (Number.isNaN(monthlyValue) || monthlyValue < 0) {
        toast.error(
          "Merci d'indiquer un quota mensuel positif (les décimales sont autorisées).",
        );
        return;
      }
      if (baseMonthly === null || Math.abs(monthlyValue - baseMonthly) > 0.0001) {
        payload.monthly_allowance = monthlyValue;
      }
    } else if (baseMonthly !== null) {
      // Interpréter un champ vide comme suppression du quota mensuel.
      payload.monthly_allowance = 0;
    }

    if (draft.requiresApproval !== (leaveType.requires_approval ?? true)) {
      payload.requires_approval = draft.requiresApproval;
    }

    if (Object.keys(payload).length === 0) {
      toast.info("Aucun changement à enregistrer.");
      return;
    }

    setProcessingIds((prev) => [...prev, leaveType.id]);
    try {
      const response = await leavesService.updateLeaveType(
        leaveType.id,
        payload,
      );

      if (!response?.success) {
        throw new Error(
          response?.message ?? "La mise à jour du type de congé a échoué.",
        );
      }

      const updatedType = response.data as LeaveType;
      setLeaveTypes((prev) =>
        prev
          .map((type) => (type.id === leaveType.id ? updatedType : type))
          .sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" })),
      );
      syncDraftValues([updatedType], false);
      toast.success(`Type "${updatedType.name}" mis à jour.`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du type de congé:", error);
      const message =
        (error as any)?.response?.data?.message ??
        (error as Error)?.message ??
        "La mise à jour du type de congé a échoué.";
      toast.error(message);
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== leaveType.id));
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Paramétrage des congés" />

      <div className="space-y-6">
        <ComponentCard title="Gestion des quotas par type de congé">
          {!canManage ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Vous n&apos;avez pas les permissions nécessaires pour modifier
              les quotas. Contactez un administrateur si besoin.
            </p>
          ) : initialLoading ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Chargement des types de congé...
            </p>
          ) : (
            <div className="space-y-6">
              <form
                onSubmit={handleCreateSubmit}
                className="rounded-lg border border-dashed border-stroke bg-gray-50 p-5 dark:border-strokedark dark:bg-boxdark/50"
              >
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
                  <div className="flex-1">
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                      Type de congé
                    </label>
                    <select
                      value={createForm.typeKey}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          typeKey: event.target.value,
                        }))
                      }
                      className="w-full rounded border border-stroke bg-white px-4 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-transparent dark:text-white"
                    >
                      {PREDEFINED_LEAVE_TYPES.map((option) => {
                        const alreadyConfigured = configuredTypeValues.includes(
                          option.value,
                        );
                        return (
                          <option
                            key={option.value}
                            value={option.value}
                            disabled={alreadyConfigured}
                          >
                            {option.label}
                            {alreadyConfigured ? " (déjà configuré)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
                  <div className="w-full md:w-40">
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                      Quota annuel (jours)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={createForm.annual}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          annual: event.target.value,
                        }))
                      }
                      placeholder="Ex. 22"
                      className="w-full rounded border border-stroke bg-white px-4 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-transparent dark:text-white"
                    />
                  </div>
                  <div className="w-full md:w-40">
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                      Quota mensuel (jours)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={createForm.monthly}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          monthly: event.target.value,
                        }))
                      }
                      placeholder="Ex. 2"
                      className="w-full rounded border border-stroke bg-white px-4 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-transparent dark:text-white"
                    />
                  </div>
                </div>
                <div className="mb-4 grid gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                      Description (optionnel)
                    </label>
                    <textarea
                      value={createForm.description}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          description: event.target.value,
                        }))
                      }
                      rows={2}
                      placeholder="Précisez la politique associée (conditions, justificatifs, etc.)."
                      className="w-full rounded border border-stroke bg-white px-4 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-transparent dark:text-white"
                    />
                  </div>
                  <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                    <input
                      type="checkbox"
                      checked={createForm.requiresApproval}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          requiresApproval: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border border-stroke text-primary focus:ring-primary dark:border-strokedark"
                    />
                    Ce congé nécessite une validation
                  </label>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Sélectionnez un type de la liste pour éviter les doublons,
                    puis ajustez les quotas annuels et mensuels selon votre
                    politique RH.
                  </p>
                  <button
                    type="submit"
                    disabled={creating || !createForm.typeKey}
                    className="inline-flex items-center justify-center rounded-md px-5 py-2 text-sm font-medium text-white transition-colors bg-primary hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-white disabled:opacity-90"
                  >
                    {creating ? "Création en cours..." : "Ajouter le type"}
                  </button>
                </div>
              </form>

              {availableTypes.length === 0 ? (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Tous les types de congé prédéfinis ont été configurés. Vous
                  pouvez toujours modifier leurs quotas ci-dessous.
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fetchTypes(true)}
                  className="inline-flex items-center justify-center rounded-md border border-stroke px-5 py-2 text-sm font-medium text-black transition-colors hover:border-primary hover:text-primary dark:border-strokedark dark:text-white"
                  disabled={isRefreshing}
                >
                  {isRefreshing ? "Actualisation..." : "Actualiser"}
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Les quotas annuels sont appliqués immédiatement et
                  synchronisés avec les soldes de l&apos;année en cours.
                </p>
              </div>

              {leaveTypes.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Aucun type de congé n&apos;est configuré pour le moment.
                  Utilisez le formulaire ci-dessus pour en créer un.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {leaveTypes.map((leaveType) => {
                    const draft = draftValues[leaveType.id];
                    const annualInput = draft?.annual ?? "0";
                    const monthlyInput = draft?.monthly ?? "";
                    const requiresApproval =
                      draft?.requiresApproval ?? leaveType.requires_approval ?? true;

                    const disabled =
                      isProcessing(leaveType.id) || !hasChanges(leaveType);

                    const monthlyLabel =
                      leaveType.monthly_allowance === null ||
                      leaveType.monthly_allowance === undefined ||
                      leaveType.monthly_allowance === 0
                        ? "Non défini"
                        : `${leaveType.monthly_allowance.toLocaleString("fr-FR", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })} jour${
                            leaveType.monthly_allowance > 1 ? "s" : ""
                          } / mois`;

                    return (
                      <div
                        key={leaveType.id}
                        className="space-y-4 rounded-lg border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark"
                      >
                        <div>
                          <h4 className="text-lg font-semibold text-black dark:text-white">
                            {leaveType.name}
                          </h4>
                          {leaveType.description && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              {leaveType.description}
                            </p>
                          )}
                        </div>

                        <label className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                          Validation requise
                        </label>
                        <div className="flex items-center justify-between rounded border border-stroke px-3 py-2 text-sm dark:border-strokedark">
                          <span>
                            {requiresApproval ? "Oui, nécessite un approbateur" : "Non, auto-validé"}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateDraft(leaveType.id, (value) => ({
                                ...value,
                                requiresApproval: !value.requiresApproval,
                              }))
                            }
                            className="text-primary underline transition-colors hover:text-primary/80"
                          >
                            Basculer
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                              Quota annuel (jours)
                            </label>
                            <input
                              type="number"
                              min={0}
                              step={0.5}
                              value={annualInput}
                              onChange={(event) =>
                                updateDraft(leaveType.id, (value) => ({
                                  ...value,
                                  annual: event.target.value,
                                }))
                              }
                              className="w-full rounded border border-stroke bg-transparent px-4 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-strokedark dark:text-white"
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Actuel :{" "}
                              <span className="font-semibold text-black dark:text-white">
                                {(leaveType.default_allowance ?? 0).toLocaleString("fr-FR", {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                jour
                                {(leaveType.default_allowance ?? 0) > 1 ? "s" : ""}
                              </span>
                            </p>
                          </div>

                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                              Quota mensuel (jours)
                            </label>
                            <input
                              type="number"
                              min={0}
                              step={0.5}
                              value={monthlyInput}
                              onChange={(event) =>
                                updateDraft(leaveType.id, (value) => ({
                                  ...value,
                                  monthly: event.target.value,
                                }))
                              }
                              placeholder="Laisser vide pour aucun quota mensuel"
                              className="w-full rounded border border-stroke bg-transparent px-4 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-strokedark dark:text-white"
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Actuel :{" "}
                              <span className="font-semibold text-black dark:text-white">
                                {monthlyLabel}
                              </span>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSave(leaveType)}
                          disabled={disabled}
                          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-primary/40"
                        >
                          {isProcessing(leaveType.id)
                            ? "Enregistrement..."
                            : "Enregistrer"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </ComponentCard>
      </div>
    </div>
  );
}
