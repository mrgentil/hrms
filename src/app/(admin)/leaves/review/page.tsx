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
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { LeaveDiscussion } from '@/components/leaves/LeaveDiscussion';

const STATUS_LABELS: Record<LeaveStatus, string> = {
  Approved: 'Approuvee',
  Rejected: 'Refusee',
  Pending: 'En attente',
  Cancelled: 'Annulee',
};

const STATUS_BADGES: Record<LeaveStatus, string> = {
  Approved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  Pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  Cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
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
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const [assignedRequests, setAssignedRequests] = useState<LeaveRequest[]>([]);
  const [assignedHistoryRequests, setAssignedHistoryRequests] = useState<LeaveRequest[]>([]);
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
      setAssignedRequests([]);
      setAssignedHistoryRequests([]);
      setRequests([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [assignedPendingResponse, assignedAllResponse, listResponse] = await Promise.all([
        leavesService.getAssignedLeaveRequests(),
        leavesService.getAssignedLeaveRequests('all'),
        canReviewAll
          ? leavesService.getAllLeaveRequests()
          : leavesService.getTeamLeaveRequests(),
      ]);

      let assignedPending: LeaveRequest[] = [];
      if (assignedPendingResponse.success) {
        assignedPending = Array.isArray(assignedPendingResponse.data)
          ? (assignedPendingResponse.data as LeaveRequest[])
          : [];
      } else {
        toast.error(
          assignedPendingResponse.message ||
            'Impossible de recuperer les demandes qui vous sont assignees.',
        );
      }

      let assignedAll: LeaveRequest[] = [];
      if (assignedAllResponse.success) {
        assignedAll = Array.isArray(assignedAllResponse.data)
          ? (assignedAllResponse.data as LeaveRequest[])
          : [];
      } else {
        toast.error(
          assignedAllResponse.message ||
            "Impossible de recuperer l'historique des demandes qui vous sont assignees.",
        );
      }

      const historyData = assignedAll.filter((request) => request.status !== 'Pending');
      const assignedAllIds = new Set(assignedAll.map((request) => request.id));

      let otherData: LeaveRequest[] = [];
      if (listResponse.success) {
        const initialData = Array.isArray(listResponse.data)
          ? (listResponse.data as LeaveRequest[])
          : [];
        otherData = initialData.filter((request) => !assignedAllIds.has(request.id));
      } else {
        toast.error(
          listResponse.message || 'Impossible de recuperer les demandes de conges.',
        );
      }

      setAssignedRequests(assignedPending);
      setAssignedHistoryRequests(historyData);
      setRequests(otherData);
    } catch (error) {
      toast.error('Erreur lors du chargement des demandes de conges.');
      setAssignedRequests([]);
      setRequests([]);
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
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('hrms:leave-approvals-updated'));
        }
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
    if (request.status !== 'Pending') {
      return null;
    }

    const isProcessing = actionId === request.id;

    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isProcessing}
          onClick={() =>
            handleStatusChange(request.id, 'Approved', { workflow_step: 'Approved' })
          }
          className="inline-flex items-center rounded-md bg-success px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-success/90 disabled:opacity-60"
        >
          {isProcessing ? 'Validation...' : 'Approuver'}
        </button>
        <button
          type="button"
          disabled={isProcessing}
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
          {isProcessing ? 'Refus...' : 'Refuser'}
        </button>
        <button
          type="button"
          disabled={isProcessing}
          onClick={() =>
            handleStatusChange(request.id, 'Cancelled', { workflow_step: 'Cancelled' })
          }
          className="inline-flex items-center rounded-md bg-gray-300 px-3 py-1 text-xs font-semibold text-gray-800 transition-colors hover:bg-gray-400 disabled:opacity-60 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
        >
          {isProcessing ? 'Annulation...' : 'Annuler'}
        </button>
      </div>
    );
  };

  const secondaryCardTitle = canReviewAll
    ? 'Toutes les demandes de conges'
    : 'Autres demandes de votre equipe';

  const renderRequestCard = (request: LeaveRequest) => {
    const startDate = new Date(request.start_date);
    const endDate = new Date(request.end_date);
    const createdAt = new Date(request.created_at);
    const updatedAt = request.approved_at ? new Date(request.approved_at) : null;
    const isAssignedToMe =
      currentUserId !== null && request.approver_user_id === currentUserId;
    const isPending = request.status === 'Pending';

    return (
      <div
        key={request.id}
        className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-black dark:text-white">
                {request.leave_type?.name || 'Type non defini'}
              </h3>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGES[request.status]}`}
              >
                {STATUS_LABELS[request.status]}
              </span>
              {isAssignedToMe && isPending && (
                <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  A votre validation
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {startDate.toLocaleDateString('fr-FR')} {'->'}{' '}
              {endDate.toLocaleDateString('fr-FR')}
            </p>
            {request.reason && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {request.reason}
              </p>
            )}
            {request.user && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Par{' '}
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
                Etape actuelle : {request.workflow_step}
              </div>
            )}
          </div>
          {renderActions(request)}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span>Cree le {createdAt.toLocaleString('fr-FR')}</span>
          {updatedAt && (
            <span>Mise a jour le {updatedAt.toLocaleString('fr-FR')}</span>
          )}
        </div>
        <LeaveDiscussion
          leaveId={request.id}
          currentUserId={currentUserId}
          canPost
          defaultOpen={isAssignedToMe && isPending}
          className="mt-4"
          title="Discussion avec l employe"
        />
      </div>
    );
  };

  if (roleLoading || loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Validation des conges" />
        <ComponentCard>
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
              <p className="text-gray-600 dark:text-gray-400">
                Chargement des demandes de conges...
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
        <PageBreadcrumb pageTitle="Validation des conges" />
        <ComponentCard title="Acces restreint">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Vous n&apos;avez pas les permissions necessaires pour consulter cette page.
          </p>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Validation des conges" />

      <ComponentCard title="Demandes en attente pour vous">
        {assignedRequests.length === 0 ? (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Aucune demande en attente a afficher.
          </p>
        ) : (
          <div className="space-y-4">
            {assignedRequests.map(renderRequestCard)}
          </div>
        )}
      </ComponentCard>

      {assignedHistoryRequests.length > 0 ? (
        <ComponentCard title="Historique de vos validations">
          <div className="space-y-4">
            {assignedHistoryRequests.map(renderRequestCard)}
          </div>
        </ComponentCard>
      ) : null}

      <ComponentCard title={secondaryCardTitle}>
        {requests.length === 0 ? (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Aucune autre demande a afficher.
          </p>
        ) : (
          <div className="space-y-4">
            {requests.map(renderRequestCard)}
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
