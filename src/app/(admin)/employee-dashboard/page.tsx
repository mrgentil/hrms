'use client';

import { useEffect, useState } from 'react';
import { employeesService, Employee, Document as EmployeeDocument } from '@/services/employees.service';
import ComponentCard from '@/components/common/ComponentCard';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';
import { leavesService, LeaveBalance } from '@/services/leaves.service';
import Image from 'next/image';
import { resolveImageUrl } from '@/lib/images';

interface EmployeeDashboardData {
  profile: Employee;
  leaveBalance: {
    totalDays: number;
    usedDays: number;
    remainingDays: number;
  };
  recentDocuments: EmployeeDocument[];
  upcomingEvents: unknown[];
}

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

export default function EmployeeDashboard() {
  const [data, setData] = useState<EmployeeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [profileResponse, balancesResponse] = await Promise.all([
          employeesService.getMyProfile(),
          leavesService.getMyLeaveBalances(),
        ]);

        if (!profileResponse.success) {
          throw new Error(profileResponse.message || 'Impossible de recuperer votre profil.');
        }

        const profile = profileResponse.data as Employee;
        let computedBalance = { totalDays: 0, usedDays: 0, remainingDays: 0 };

        if (balancesResponse.success) {
          const balances = balancesResponse.data as LeaveBalance[];
          const totals = balances.reduce(
            (acc, balance) => {
              const totalAvailable = (balance.days_accrued ?? 0) + (balance.days_carried_over ?? 0);
              return {
                totalDays: acc.totalDays + totalAvailable,
                usedDays: acc.usedDays + (balance.days_used ?? 0),
              };
            },
            { totalDays: 0, usedDays: 0 },
          );
          const remaining = Math.max(totals.totalDays - totals.usedDays, 0);
          computedBalance = {
            totalDays: totals.totalDays,
            usedDays: totals.usedDays,
            remainingDays: remaining,
          };
        } else {
          toast.warning(
            balancesResponse.message || 'Impossible de recuperer vos soldes de conges.',
          );
        }

        setData({
          profile,
          leaveBalance: computedBalance,
          recentDocuments:
            profile.user_document_user_document_user_idTouser?.slice(0, 3) || [],
          upcomingEvents: [],
        });
      } catch (err) {
        const message = getErrorMessage(err, 'Erreur lors du chargement du tableau de bord.');
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Mon Espace Employe" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Chargement de votre espace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Mon Espace Employe" />
        <ComponentCard title="Erreur">
          <div className="text-center py-8">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-red-600 dark:text-red-400 mb-4">
              Impossible de charger votre espace employe
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Reessayer
            </button>
          </div>
        </ComponentCard>
      </div>
    );
  }

  const { profile, leaveBalance, recentDocuments } = data;
  const profilePhoto = resolveImageUrl(profile.profile_photo_url);

  return (
    <div>
      <PageBreadcrumb pageTitle="Mon Espace Employe" />

      <div className="space-y-6">
        {/* Message de bienvenue */}
        <ComponentCard title={`Bienvenue, ${profile.full_name} !`}>
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                {profilePhoto ? (
                  <Image
                    src={profilePhoto}
                    alt={profile.full_name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  profile.full_name.charAt(0).toUpperCase()
                )}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-black dark:text-white">
                {profile.full_name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {profile.position?.title || 'Employe'} - {profile.department_user_department_idTodepartment?.department_name || 'Departement non assigne'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Employe depuis le {profile.hire_date ? new Date(profile.hire_date).toLocaleDateString('fr-FR') : 'Date inconnue'}
              </p>
            </div>
          </div>
        </ComponentCard>

        {/* Actions rapides */}
        <ComponentCard title="Actions rapides">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/employees/documents"
              className="flex flex-col items-center p-6 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20 hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
            >
              <div className="text-3xl mb-2">👤</div>
              <h3 className="font-semibold text-black dark:text-white mb-1">Mon Profil</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                Voir et modifier mes informations
              </p>
            </Link>

            <Link
              href="/leaves/my-leaves"
              className="flex flex-col items-center p-6 bg-success/5 dark:bg-success/10 rounded-lg border border-success/20 hover:bg-success/10 dark:hover:bg-success/20 transition-colors"
            >
              <div className="text-3xl mb-2">🏖️</div>
              <h3 className="font-semibold text-black dark:text-white mb-1">Mes Conges</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                Gerer mes demandes de conges
              </p>
            </Link>

            <Link
              href="/employees/organigramme"
              className="flex flex-col items-center p-6 bg-warning/5 dark:bg-warning/10 rounded-lg border border-warning/20 hover:bg-warning/10 dark:hover:bg-warning/20 transition-colors"
            >
              <div className="text-3xl mb-2">🏢</div>
              <h3 className="font-semibold text-black dark:text-white mb-1">Organigramme</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                Structure de l&apos;entreprise
              </p>
            </Link>

            <Link
              href="/employees/search"
              className="flex flex-col items-center p-6 bg-meta-5/5 dark:bg-meta-5/10 rounded-lg border border-meta-5/20 hover:bg-meta-5/10 dark:hover:bg-meta-5/20 transition-colors"
            >
              <div className="text-3xl mb-2">🔍</div>
              <h3 className="font-semibold text-black dark:text-white mb-1">Annuaire</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                Rechercher des collegues
              </p>
            </Link>
          </div>
        </ComponentCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Solde de conges */}
          <ComponentCard title="Mon solde de conges">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Conges annuels</span>
                <span className="text-lg font-bold text-black dark:text-white">{leaveBalance.totalDays} jours</span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-primary h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(leaveBalance.usedDays / leaveBalance.totalDays) * 100}%` }}
                ></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-danger">{leaveBalance.usedDays}</div>
                  <div className="text-gray-600 dark:text-gray-400">Utilises</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-success">{leaveBalance.remainingDays}</div>
                  <div className="text-gray-600 dark:text-gray-400">Restants</div>
                </div>
              </div>

              <Link
                href="/leaves/my-leaves"
                className="block w-full text-center bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Voir mes conges
              </Link>
            </div>
          </ComponentCard>

          {/* Informations de contact */}
          <ComponentCard title="Mes informations de contact">
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Email professionnel:</span>
                <div className="text-black dark:text-white">{profile.work_email || 'Non renseigne'}</div>
              </div>
              
              {profile.user_personal_info?.[0]?.mobile && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Telephone:</span>
                  <div className="text-black dark:text-white">{profile.user_personal_info[0].mobile}</div>
                </div>
              )}
              
              {profile.user_personal_info?.[0]?.email_address && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Email personnel:</span>
                  <div className="text-black dark:text-white">{profile.user_personal_info[0].email_address}</div>
                </div>
              )}

              {profile.user_personal_info?.[0]?.address && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Adresse:</span>
                  <div className="text-black dark:text-white">{profile.user_personal_info[0].address}</div>
                </div>
              )}

              <Link
                href="/employees/documents"
                className="block w-full text-center bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Modifier mes informations
              </Link>
            </div>
          </ComponentCard>
        </div>

        {/* Documents recents */}
        {recentDocuments.length > 0 && (
          <ComponentCard title="Mes documents recents">
            <div className="space-y-3">
              {recentDocuments.map((document) => (
                <div key={document.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">📄</div>
                    <div>
                      <h4 className="font-medium text-black dark:text-white">{document.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {document.document_type} • Ajoute le {new Date(document.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  {document.is_confidential && (
                    <span className="inline-flex rounded-full bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
                      Confidentiel
                    </span>
                  )}
                </div>
              ))}
              
              <Link
                href="/employees/documents"
                className="block w-full text-center bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Voir tous mes documents
              </Link>
            </div>
          </ComponentCard>
        )}

        {/* Informations utiles */}
        <ComponentCard title="Informations utiles">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-black dark:text-white mb-3">Contacts utiles</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">RH:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">rh@entreprise.com</span>
                </div>
                <div>
                  <span className="font-medium">Support IT:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">support@entreprise.com</span>
                </div>
                <div>
                  <span className="font-medium">Comptabilite:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">compta@entreprise.com</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-black dark:text-white mb-3">Liens rapides</h4>
              <div className="space-y-2">
                <Link href="/employees/organigramme" className="block text-sm text-primary hover:underline">
                  &rarr; Voir l&apos;organigramme
                </Link>
                <Link href="/employees/search" className="block text-sm text-primary hover:underline">
                  &rarr; Rechercher un collegue
                </Link>
                <Link href="/leaves/my-leaves" className="block text-sm text-primary hover:underline">
                  &rarr; Demander un conge
                </Link>
              </div>
            </div>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
