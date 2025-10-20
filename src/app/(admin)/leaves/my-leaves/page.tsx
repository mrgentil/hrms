'use client';



import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import ComponentCard from '@/components/common/ComponentCard';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';

import { useToast } from '@/hooks/useToast';

import {

  leavesService,

  LeaveBalance,

  LeaveRequest,

  LeaveStatus,

  LeaveType,

  LeaveTypeCode,

  CreateLeaveRequestPayload,

  UpdateLeaveRequestPayload,

  LeaveApprover,

} from '@/services/leaves.service';



const APPLICATION_TYPE_LABELS: Record<LeaveTypeCode, string> = {
  CongePaye: 'Congé Payé',
  Maladie: 'Maladie',
  TeleTravail: 'TéléTravail',
  Marriage: 'Marriage',
  Permission: 'Permission',
  Abscence: 'Abscence',
  Demenagement: 'Déménagement',
  Deces: 'Décès',
};

const APPLICATION_TYPE_ALIASES: Record<string, LeaveTypeCode> = {
  CongePaye: 'CongePaye',
  'Congé Payé': 'CongePaye',
  Maladie: 'Maladie',
  TeleTravail: 'TeleTravail',
  'TéléTravail': 'TeleTravail',
  Marriage: 'Marriage',
  Permission: 'Permission',
  Abscence: 'Abscence',
  Demenagement: 'Demenagement',
  'Déménagement': 'Demenagement',
  Deces: 'Deces',
  'Décès': 'Deces',
};

const DEFAULT_APPLICATION_TYPES: LeaveTypeCode[] = [
  'CongePaye',
  'Maladie',
  'TeleTravail',
  'Marriage',
  'Permission',
  'Abscence',
  'Demenagement',
  'Deces',
];

const normalizeApplicationType = (value: unknown): LeaveTypeCode | null => {
  if (typeof value !== 'string') {
    return null;
  }

  return APPLICATION_TYPE_ALIASES[value] ?? null;
};

interface LeaveFormState {
  leave_type_id: string;

  type: LeaveTypeCode;

  start_date: string;

  end_date: string;

  reason: string;

  approver_user_id: string;

}



const INITIAL_FORM: LeaveFormState = {

  leave_type_id: '',

  type: 'CongePaye',

  start_date: '',

  end_date: '',

  reason: '',

  approver_user_id: '',

};



const getErrorMessage = (err: unknown, fallback: string) => {

  if (typeof err === 'string') {

    return err;

  }



  if (err && typeof err === 'object') {

    const maybeError = err as {

      response?: { data?: { message?: string } };

      message?: string;

    };



    if (maybeError.response?.data?.message) {

      return maybeError.response.data.message;

    }



    if (maybeError.message) {

      return maybeError.message;

    }

  }



  return fallback;

};



export default function MyLeavesPage() {

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [applicationTypes, setApplicationTypes] = useState<LeaveTypeCode[]>(DEFAULT_APPLICATION_TYPES);
  const [approvers, setApprovers] = useState<LeaveApprover[]>([]);

  const [loading, setLoading] = useState(true);

  const [showNewLeaveForm, setShowNewLeaveForm] = useState(false);

  const [formData, setFormData] = useState<LeaveFormState>(INITIAL_FORM);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLeave, setEditingLeave] = useState<LeaveRequest | null>(null);
  const [cancellingLeaveId, setCancellingLeaveId] = useState<number | null>(null);

  const toast = useToast();

  const resetFormState = useCallback(() => {

    setFormData({

      ...INITIAL_FORM,

      type: applicationTypes.length > 0 ? applicationTypes[0] : INITIAL_FORM.type,

    });

    setEditingLeave(null);

  }, [applicationTypes]);



  const closeForm = useCallback(() => {

    resetFormState();

    setShowNewLeaveForm(false);

  }, [resetFormState]);



  const openCreateForm = useCallback(() => {

    resetFormState();

    setShowNewLeaveForm(true);

  }, [resetFormState]);



  const handleStartEditing = useCallback((request: LeaveRequest) => {

    const normalizedType = applicationTypes.includes(request.type)

      ? request.type

      : applicationTypes[0] ?? INITIAL_FORM.type;



    if (request.approver_user_id) {

      setApprovers((current) => {

        if (current.some((item) => item.id === request.approver_user_id)) {

          return current;

        }



        return [

          ...current,

          {

            id: request.approver_user_id,

            full_name: `Responsable #${request.approver_user_id}`,

            work_email: undefined,

          },

        ];

      });

    }



    setFormData({

      leave_type_id: request.leave_type_id ? String(request.leave_type_id) : '',

      type: normalizedType,

      start_date: request.start_date ? request.start_date.slice(0, 10) : '',

      end_date: request.end_date ? request.end_date.slice(0, 10) : '',

      reason: request.reason ?? '',

      approver_user_id: request.approver_user_id ? String(request.approver_user_id) : '',

    });

    setEditingLeave(request);

    setShowNewLeaveForm(true);

  }, [applicationTypes]);



  const handleToggleForm = useCallback(() => {

    if (editingLeave) {

      closeForm();

      return;

    }



    if (showNewLeaveForm) {

      closeForm();

    } else {

      openCreateForm();

    }

  }, [editingLeave, showNewLeaveForm, closeForm, openCreateForm]);



  const fetchLeaveData = useCallback(async () => {
  try {
    setLoading(true);

    const [
      requestsResponse,
      balancesResponse,
      typesResponse,
      approversResponse,
      applicationTypesResponse,
    ] = await Promise.all([
      leavesService.getMyLeaves(),
      leavesService.getMyLeaveBalances(),
      leavesService.getLeaveTypes(),
      leavesService.getLeaveApprovers(),
      leavesService.getApplicationTypes(),
    ]);

    if (requestsResponse.success) {
      setLeaveRequests(requestsResponse.data as LeaveRequest[]);
    } else {
      toast.error(requestsResponse.message || 'Impossible de recuperer vos demandes de conges.');
    }

    if (balancesResponse.success) {
      setLeaveBalances(balancesResponse.data as LeaveBalance[]);
    } else {
      toast.error(balancesResponse.message || 'Impossible de recuperer vos soldes de conges.');
    }

    if (typesResponse.success) {
      setLeaveTypes(typesResponse.data as LeaveType[]);
    } else {
      toast.error(typesResponse.message || 'Impossible de recuperer les types de conges.');
    }

    if (approversResponse.success) {
      const approverList = approversResponse.data as LeaveApprover[];

      setApprovers(approverList);

      if (approverList.length > 0) {
        setFormData((previous) => ({
          ...previous,
          approver_user_id: previous.approver_user_id || String(approverList[0].id),
        }));
      }
    } else {
      toast.error(approversResponse.message || 'Impossible de recuperer la liste des responsables.');
    }

    if (applicationTypesResponse.success) {
      const rawTypes = Array.isArray(applicationTypesResponse.data)
        ? applicationTypesResponse.data
        : [];

      const normalizedTypes = rawTypes
        .map((value: unknown) => normalizeApplicationType(value))
        .filter((value): value is LeaveTypeCode => Boolean(value));

      const nextTypes =
        normalizedTypes.length > 0
          ? Array.from(new Set(normalizedTypes))
          : DEFAULT_APPLICATION_TYPES;

      setApplicationTypes(nextTypes);

      setFormData((previous) => {
        if (previous.type && nextTypes.includes(previous.type)) {
          return previous;
        }

        return {
          ...previous,
          type: nextTypes[0],
        };
      });
    } else {
      toast.error(
        applicationTypesResponse.message || 'Impossible de recuperer les types de demande disponibles.',
      );

      setApplicationTypes(DEFAULT_APPLICATION_TYPES);

      setFormData((previous) => ({
        ...previous,
        type: DEFAULT_APPLICATION_TYPES.includes(previous.type) ? previous.type : DEFAULT_APPLICATION_TYPES[0],
      }));
    }
  } catch (err) {
    const message = getErrorMessage(err, 'Erreur lors du chargement des donnees de conges.');
    toast.error(message);
  } finally {
    setLoading(false);
  }
}, [toast]);




  useEffect(() => {

    fetchLeaveData();

  }, [fetchLeaveData]);



  useEffect(() => {

    if (showNewLeaveForm && approvers.length > 0) {

      setFormData((previous) => ({

        ...previous,

        approver_user_id: previous.approver_user_id || String(approvers[0].id),

      }));

    }

  }, [showNewLeaveForm, approvers]);



  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {

    const { name, value } = event.target;

    setFormData((previous) => ({

      ...previous,

      [name]: value,

    }));

  };



  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {

    event.preventDefault();



    if (!formData.start_date || !formData.end_date) {

      toast.error('Veuillez renseigner une date de debut et de fin.');

      return;

    }



    if (new Date(formData.end_date) < new Date(formData.start_date)) {

      toast.error('La date de fin doit etre posterieure a la date de debut.');

      return;

    }



    const trimmedReason = formData.reason.trim();

    if (trimmedReason.length < 5) {

      toast.error('Le motif doit contenir au moins 5 caracteres.');

      return;

    }



    try {

      setIsSubmitting(true);

      const payload: UpdateLeaveRequestPayload = {

        type: formData.type,

        start_date: formData.start_date,

        end_date: formData.end_date,

        reason: trimmedReason,

      };



      if (formData.leave_type_id) {

        payload.leave_type_id = Number(formData.leave_type_id);

      }



      if (formData.approver_user_id) {

        payload.approver_user_id = Number(formData.approver_user_id);

      }



      let response;

      if (editingLeave) {

        response = await leavesService.updateMyLeave(editingLeave.id, payload);

      } else {

        response = await leavesService.createLeaveRequest(payload as CreateLeaveRequestPayload);

      }



      if (response.success) {
        const successMessage =
          typeof response.message === 'string' && response.message.trim().length > 0
            ? response.message
            : editingLeave
            ? 'Demande de conge mise a jour.'
            : 'Votre demande de conge a ete creee.';

        toast.success(successMessage);

        closeForm();

        await fetchLeaveData();

      } else {
        const errorMessage =
          response.message ||
          (editingLeave
            ? 'Impossible de mettre a jour la demande de conge.'
            : 'Impossible de creer la demande de conge.');

        toast.error(errorMessage);

      }

    } catch (err) {

      const message = getErrorMessage(
        err,

        editingLeave
          ? 'Erreur lors de la mise a jour de la demande de conge.'
          : 'Erreur lors de la creation de la demande de conge.',
      );

      toast.error(message);

    } finally {

      setIsSubmitting(false);

    }

  };



  const handleCancelRequest = useCallback(

    async (request: LeaveRequest) => {

      const confirmed = window.confirm('Voulez-vous vraiment annuler cette demande ?');

      if (!confirmed) {

        return;

      }



      try {

        setCancellingLeaveId(request.id);

        const response = await leavesService.cancelMyLeave(request.id, {});



        if (response.success) {
          const successMessage =
            typeof response.message === 'string' && response.message.trim().length > 0
              ? response.message
              : 'Demande de conge annulee.';

          toast.success(successMessage);

          if (editingLeave?.id === request.id) {

            closeForm();

          }

          await fetchLeaveData();

        } else {

          toast.error(response.message || "Impossible d'annuler la demande de conge.");

        }

      } catch (err) {

        const message = getErrorMessage(err, "Erreur lors de l'annulation de la demande de conge.");

        toast.error(message);

      } finally {

        setCancellingLeaveId(null);

      }

    },

    [toast, fetchLeaveData, editingLeave, closeForm],

  );



  const getStatusColor = useCallback((status: LeaveStatus) => {

    switch (status) {

      case 'Approved':

        return 'bg-success/10 text-success';

      case 'Rejected':

        return 'bg-danger/10 text-danger';

      case 'Pending':

        return 'bg-warning/10 text-warning';

      case 'Cancelled':

      default:

        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';

    }

  }, []);



  const getStatusText = useCallback((status: LeaveStatus) => {

    switch (status) {

      case 'Approved':

        return 'Approuve';

      case 'Rejected':

        return 'Refuse';

      case 'Pending':

        return 'En attente';

      case 'Cancelled':

        return 'Annule';

      default:

        return status;

    }

  }, []);



  const calculateDays = useCallback((startDate: string, endDate: string) => {

    const start = new Date(startDate);

    const end = new Date(endDate);

    const diffTime = Math.abs(end.getTime() - start.getTime());

    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  }, []);



  const aggregatedBalances = useMemo(() => {

    const totals = leaveBalances.reduce(

      (acc, balance) => {

        const totalAvailable = (balance.days_accrued ?? 0) + (balance.days_carried_over ?? 0);

        return {

          total: acc.total + totalAvailable,

          used: acc.used + (balance.days_used ?? 0),

        };

      },

      { total: 0, used: 0 },

    );



    const remaining = Math.max(totals.total - totals.used, 0);

    return {

      totalDays: totals.total,

      usedDays: totals.used,

      remainingDays: remaining,

    };

  }, [leaveBalances]);



  if (loading) {

    return (

      <div>

        <PageBreadcrumb pageTitle="Mes Conges" />

        <div className="flex items-center justify-center min-h-[400px]">

          <div className="text-center">

            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>

            <p className="text-gray-600 dark:text-gray-400">Chargement de vos conges...</p>

          </div>

        </div>

      </div>

    );

  }



  return (

    <div>

      <PageBreadcrumb pageTitle="Mes Conges" />



      <div className="space-y-6">

        <ComponentCard title="Vue d&apos;ensemble">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 dark:bg-primary/10">

              <h4 className="text-sm text-gray-600 dark:text-gray-400 mb-1">Solde total</h4>

              <p className="text-2xl font-semibold text-primary">

                {aggregatedBalances.totalDays.toFixed(1)} jours

              </p>

            </div>

            <div className="rounded-lg border border-danger/20 bg-danger/5 p-4 dark:bg-danger/10">

              <h4 className="text-sm text-gray-600 dark:text-gray-400 mb-1">Utilises</h4>

              <p className="text-2xl font-semibold text-danger">

                {aggregatedBalances.usedDays.toFixed(1)} jours

              </p>

            </div>

            <div className="rounded-lg border border-success/20 bg-success/5 p-4 dark:bg-success/10">

              <h4 className="text-sm text-gray-600 dark:text-gray-400 mb-1">Restants</h4>

              <p className="text-2xl font-semibold text-success">

                {aggregatedBalances.remainingDays.toFixed(1)} jours

              </p>

            </div>

          </div>

        </ComponentCard>



        <ComponentCard title="Actions rapides">

          <div className="flex flex-wrap items-center gap-4">

            <button

              onClick={handleToggleForm}

              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"

            >

              {editingLeave

                ? 'Annuler la modification'

                : showNewLeaveForm

                ? 'Fermer le formulaire'

                : 'Nouvelle demande de conge'}

            </button>

            <button

              type="button"

              onClick={() => fetchLeaveData()}

              className="inline-flex items-center justify-center rounded-md border border-stroke px-6 py-3 text-sm font-medium text-black transition-colors hover:border-primary hover:text-primary dark:border-strokedark dark:text-white"

            >

              Rafraichir

            </button>

          </div>

        </ComponentCard>



        {showNewLeaveForm && (

          <ComponentCard title={editingLeave ? 'Modifier une demande de conge' : 'Nouvelle demande de conge'}>

            {editingLeave ? (

              <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">

                Modification de la demande #{editingLeave.id} (du {new Date(editingLeave.start_date).toLocaleDateString('fr-FR')} au {new Date(editingLeave.end_date).toLocaleDateString('fr-FR')})

              </div>

            ) : null}

            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">

                    Type de conge

                  </label>

                  <select

                    name="type"

                    value={formData.type}

                    onChange={handleInputChange}

                    className="w-full rounded border border-stroke px-4 py-2 text-sm outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"

                  >

                    {applicationTypes.length === 0 ? (

                      <option value="">Aucun type de demande disponible</option>

                    ) : (

                      applicationTypes.map((typeOption) => (

                        <option key={typeOption} value={typeOption}>

                          {APPLICATION_TYPE_LABELS[typeOption] ?? typeOption}

                        </option>

                      ))

                    )}

                  </select>

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">

                    Categorie RH (optionnel)

                  </label>

                  <select

                    name="leave_type_id"

                    value={formData.leave_type_id}

                    onChange={handleInputChange}

                    className="w-full rounded border border-stroke px-4 py-2 text-sm outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"

                  >

                    <option value="">Selectionner un type</option>

                    {leaveTypes.map((type) => (

                      <option key={type.id} value={type.id}>

                        {type.name}

                      </option>

                    ))}

                  </select>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">

                    Lie la demande a une categorie RH definie dans la table leave_type. Laisser vide si non applicable.

                  </p>

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">

                    Destinataire (manager / RH)

                  </label>

                  <select

                    name="approver_user_id"

                    value={formData.approver_user_id}

                    onChange={handleInputChange}

                    className="w-full rounded border border-stroke px-4 py-2 text-sm outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"

                  >

                    {approvers.length === 0 ? (

                      <option value="">Aucun responsable disponible</option>

                    ) : null}

                    {approvers.map((approver) => (

                      <option key={approver.id} value={approver.id}>

                        {approver.full_name}

                        {approver.work_email ? ` - ${approver.work_email}` : ''}

                      </option>

                    ))}

                  </select>

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">

                    Date de debut

                  </label>

                  <input

                    type="date"

                    name="start_date"

                    value={formData.start_date}

                    onChange={handleInputChange}

                    className="w-full rounded border border-stroke px-4 py-2 text-sm outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"

                    required

                  />

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">

                    Date de fin

                  </label>

                  <input

                    type="date"

                    name="end_date"

                    value={formData.end_date}

                    onChange={handleInputChange}

                    className="w-full rounded border border-stroke px-4 py-2 text-sm outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"

                    required

                  />

                </div>

              </div>



              <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">

                  Motif

                </label>

                <textarea

                  name="reason"

                  value={formData.reason}

                  onChange={handleInputChange}

                  rows={4}

                  placeholder="Expliquez le motif de votre demande..."

                  className="w-full rounded border border-stroke px-4 py-3 text-sm outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"

                  required

                />

              </div>



              <div className="flex flex-wrap items-center gap-4">

                <button

                  type="submit"

                  disabled={isSubmitting}

                  className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"

                >

                  {isSubmitting

                    ? editingLeave

                      ? 'Mise a jour...'

                      : 'Envoi en cours...'

                    : editingLeave

                    ? 'Mettre a jour la demande'

                    : 'Envoyer la demande'}

                </button>

                <button

                  type="button"

                  onClick={closeForm}

                  className="inline-flex items-center justify-center rounded-md border border-stroke px-6 py-3 text-sm font-medium text-black transition-colors hover:border-primary hover:text-primary dark:border-strokedark dark:text-white"

                >

                  Annuler

                </button>

              </div>

            </form>

          </ComponentCard>

        )}



        <ComponentCard title="Mes soldes de conges">

          {leaveBalances.length === 0 ? (

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">

              Aucun solde de conge disponible pour le moment.

            </p>

          ) : (

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {leaveBalances.map((balance) => {

                const totalAvailable = balance.days_accrued + balance.days_carried_over;

                const remainingDays = totalAvailable - balance.days_used;

                const usagePercentage = totalAvailable > 0 ? (balance.days_used / totalAvailable) * 100 : 0;



                return (

                  <div key={balance.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">

                    <h4 className="font-semibold text-black dark:text-white mb-3">

                      {balance.leave_type.name}

                    </h4>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">

                      Annee {balance.year}

                    </p>

                    <div className="space-y-2 text-sm">

                      <div className="flex justify-between">

                        <span>Acquis</span>

                        <span className="font-semibold text-black dark:text-white">

                          {balance.days_accrued.toFixed(1)} j

                        </span>

                      </div>

                      <div className="flex justify-between">

                        <span>Reportes</span>

                        <span className="font-semibold text-black dark:text-white">

                          {balance.days_carried_over.toFixed(1)} j

                        </span>

                      </div>

                      <div className="flex justify-between">

                        <span>Utilises</span>

                        <span className="font-semibold text-danger">

                          {balance.days_used.toFixed(1)} j

                        </span>

                      </div>

                      <div className="flex justify-between">

                        <span>Restants</span>

                        <span className="font-semibold text-success">

                          {Math.max(remainingDays, 0).toFixed(1)} j

                        </span>

                      </div>

                    </div>

                    <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">

                      <div

                        className="bg-primary h-2 rounded-full transition-all duration-300"

                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}

                      ></div>

                    </div>

                  </div>

                );

              })}

            </div>

          )}

        </ComponentCard>



        <ComponentCard title="Mes demandes de conges">

          {leaveRequests.length === 0 ? (

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">

              Vous n&apos;avez pas encore cree de demande de conge.

            </p>

          ) : (

            <div className="space-y-4">

              {leaveRequests.map((request) => {

                const isEditingThisRequest = editingLeave?.id === request.id;

                return (

                  <div

                    key={request.id}

                    className={`bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg p-5 ${isEditingThisRequest ? 'border-primary shadow-lg shadow-primary/10' : ''}`}

                  >

                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">

                      <div>

                        <div className="flex items-center gap-2">

                          <h4 className="text-lg font-semibold text-black dark:text-white">

                            {request.leave_type?.name || 'Type non defini'}

                          </h4>

                          {isEditingThisRequest ? (

                            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">

                              Edition en cours

                            </span>

                          ) : null}

                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400">

                          {new Date(request.start_date).toLocaleDateString('fr-FR')} &rarr;{' '}

                          {new Date(request.end_date).toLocaleDateString('fr-FR')} ({calculateDays(request.start_date, request.end_date)} jours)

                        </p>

                      </div>

                      <span

                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(request.status)}`}

                      >

                        {getStatusText(request.status)}

                      </span>

                    </div>

                    <div className="mt-4 text-sm text-gray-700 dark:text-gray-300">

                      {request.reason}

                    </div>

                    {request.status === 'Pending' ? (

                      <div className="mt-4 flex flex-wrap gap-2">

                        <button

                          type="button"

                          onClick={() => handleStartEditing(request)}

                          disabled={isEditingThisRequest || isSubmitting || cancellingLeaveId === request.id}

                          className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"

                        >

                          {isEditingThisRequest ? 'Modification en cours' : 'Modifier'}

                        </button>

                        <button

                          type="button"

                          onClick={() => handleCancelRequest(request)}

                          disabled={cancellingLeaveId === request.id}

                          className="inline-flex items-center rounded-md bg-danger px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-danger/90 disabled:opacity-60"

                        >

                          {cancellingLeaveId === request.id ? 'Annulation...' : 'Annuler la demande'}

                        </button>

                      </div>

                    ) : null}

                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-4">

                      <span>

                        Cree le {new Date(request.created_at).toLocaleString('fr-FR')}

                      </span>

                      {request.approver_user_id ? (

                        <span>

                          Responsable : {(() => {

                            const approver = approvers.find((item) => item.id === request.approver_user_id);

                            return approver ? `${approver.full_name}${approver.work_email ? ` (${approver.work_email})` : ''}` : `#${request.approver_user_id}`;

                          })()}

                        </span>

                      ) : null}

                      {request.workflow_step && (

                        <span>

                          Etape du workflow : {request.workflow_step}

                        </span>

                      )}

                      {request.approver_comment && (

                        <span className="italic">

                          Commentaire manager : {request.approver_comment}

                        </span>

                      )}

                    </div>

                  </div>

                );

              })}


            </div>

          )}

        </ComponentCard>

      </div>

    </div>

  );

}

