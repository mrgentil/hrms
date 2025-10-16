'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ComponentCard from '@/components/common/ComponentCard';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { useToast } from '@/hooks/useToast';
import {
  leavesService,
  LeaveRequest,
  LeaveStatus,
  UpdateLeaveStatusPayload,
} from '@/services/leaves.service';
import { useUserRole } from '@/hooks/useUserRole';
import Link from 'next/link';

const STATUS_LABELS: Record<LeaveStatus, string> = {
  Approved: 'Approuvé',
  Rejected: 'Refusé',
  Pending: 'En attente',
  Cancelled: 'Annulé',
};

const STATUS_BADGES: Record<LeaveStatus, string> = {
  Approved: 'bg-success/10 text-success',
  Rejected: 'bg-danger/10 text-danger',
  Pending: 'bg-warning/10 text-warning',
  Cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const SUCCESS_MESSAGE_BY_STATUS: Record<LeaveStatus, string> = {
  Approved: 'Demande approuvee.',
  Rejected: 'Demande refusee.',
  Pending: 'Demande remise en attente.',
  Cancelled: 'Demande annulee.',
};

const ERROR_MESSAGE_BY_STATUS: Record<LeaveStatus, string> = {
  Approved: 'Impossible d approuver la demande.',
  Rejected: 'Impossible de refuser la demande.',
  Pending: 'Impossible de remettre la demande en attente.',
  Cancelled: 'Impossible d annuler la demande.',
};

export default function LeaveReviewPage() {
  const toast = useToast();
  const { role: userRole, loading: roleLoading } = useUserRole();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const canReviewAll = useMemo(
    () => !!userRole && (userRole.isSuperAdmin || userRole.isAdmin || userRole.isHR),
    [userRole],
  );

  const canReviewTeam = useMemo(
    () => !!userRole && (userRole.isManager || canReviewAll),
    [canReviewAll, userRole],
  );

  const loadRequests = useCallback(async () => {
    if (!canReviewTeam) {
      setRequests([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = canReviewAll
        ? await leavesService.getAllLeaveRequests()
        : await leavesService.getTeamLeaveRequests();

      if (response.success) {
        setRequests(response.data as LeaveRequest[]);
      } else {
        toast.error(response.message || 'Impossible de récupérer les demandes de congés.');
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des demandes de congés.');
    } finally {
      setLoading(false);
    }
  }, [canReviewAll, canReviewTeam, toast]);

  useEffect(() => {
    if (!roleLoading) {
      loadRequests();
    }
  }, [loadRequests, roleLoading]);

  const handleStatusChange = async (
    leaveId: number,
    status: LeaveStatus,
    extra?: Partial<UpdateLeaveStatusPayload>,
  ) => {
    const successFallback =
      SUCCESS_MESSAGE_BY_STATUS[status] ?? 'Statut mis a jour.';
    const errorFallback =
      ERROR_MESSAGE_BY_STATUS[status] ?? 'Impossible de mettre a jour la demande.';

    setActionId(leaveId);
    try {
      const payload: UpdateLeaveStatusPayload = {
        status,
        ...extra,
      };
      const response = await leavesService.updateLeaveStatus(leaveId, payload);
      if (response.success) {
        const successMessage =
          typeof response.message === 'string' && response.message.trim().length > 0
            ? response.message
            : successFallback;

        toast.success(successMessage);
        await loadRequests();
      } else {
        const errorMessage =
          typeof response.message === 'string' && response.message.trim().length > 0
            ? response.message
            : errorFallback;

        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error(errorFallback);
    } finally {
      setActionId(null);
    }
  };

  const renderActions = (request: LeaveRequest) => {
    if (request.status === 'Approved' || request.status === 'Rejected') {
      return null;
    }

    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={actionId === request.id}
          onClick={() =>
            handleStatusChange(request.id, 'Approved', { workflow_step: 'Approved' })
          }
          className="inline-flex items-center rounded-md bg-success px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-success/90 disabled:opacity-60"
        >
          {actionId === request.id ? 'Validation...' : 'Approuver'}
        </button>
        <button
          type="button"
          disabled={actionId === request.id}
          onClick={() => {
            const comment = window.prompt('Motif du refus ?');
            if (comment === null) {
              return;
            }
            handleStatusChange(request.id, 'Rejected', {
              approver_comment: comment || undefined,
              workflow_step: 'Rejected',
            });
          }}
          className="inline-flex items-center rounded-md bg-danger px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-danger/90 disabled:opacity-60"
        >
          {actionId === request.id ? 'Refus...' : 'Refuser'}
        </button>
        <button
          type="button"
          disabled={actionId === request.id}
          onClick={() =>
            handleStatusChange(request.id, 'Cancelled', { workflow_step: 'Cancelled' })
          }
          className="inline-flex items-center rounded-md bg-gray-300 px-3 py-1 text-xs font-semibold text-gray-800 transition-colors hover:bg-gray-400 disabled:opacity-60 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
        >
          {actionId === request.id ? 'Annulation...' : 'Annuler'}
        </button>
      </div>
    );
  };

  if (roleLoading || loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Validation des congés" />
        <ComponentCard>
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
              <p className="text-gray-600 dark:text-gray-400">
                Chargement des demandes de congés...
              </p>
            </div>
          </div>
        </ComponentCard>
      </div>
    );
  }

  if (!canReviewTeam) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Validation des congés" />
        <ComponentCard title="Accès restreint">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Vous n&apos;avez pas les permissions nécessaires pour consulter cette page.
          </p>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Validation des congés" />

      <ComponentCard title="Demandes de congés à traiter">
        {requests.length === 0 ? (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Aucune demande de congé à afficher.
          </p>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-black dark:text-white">
                        {request.leave_type?.name || 'Type non défini'}
                      </h3>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGES[request.status]}`}
                      >
                        {STATUS_LABELS[request.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(request.start_date).toLocaleDateString('fr-FR')} →{' '}
                      {new Date(request.end_date).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {request.reason}
                    </p>
                    {request.user && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Par :{' '}
                        <Link
                          href={`/users/${request.user.id}`}
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          {request.user.full_name}
                        </Link>{' '}
                        ({request.user.work_email || 'Email indisponible'})
                      </div>
                    )}
                    {request.workflow_step && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Étape actuelle : {request.workflow_step}
                      </div>
                    )}
                    {request.approver_comment && (
                      <div className="text-xs italic text-gray-500 dark:text-gray-400">
                        Commentaire précédent : {request.approver_comment}
                      </div>
                    )}
                  </div>
                  {renderActions(request)}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    Créée le {new Date(request.created_at).toLocaleString('fr-FR')}
                  </span>
                  {request.approved_at && (
                    <span>
                      Mise à jour le {new Date(request.approved_at).toLocaleString('fr-FR')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
