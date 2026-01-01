'use client';

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  employeesService,
  Employee,
  UpdateMyProfilePayload,
  Document as EmployeeDocument,
} from '@/services/employees.service';
import ComponentCard from '@/components/common/ComponentCard';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { resolveImageUrl } from '@/lib/images';

interface ProfileFormState {
  full_name: string;
  work_email: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  spouse_name: string;
  id_number: string;
  address: string;
  city: string;
  country: string;
  mobile: string;
  phone: string;
  email_address: string;
  emergency_contact_primary_name: string;
  emergency_contact_primary_relation: string;
  emergency_contact_primary_phone: string;
  emergency_contact_secondary_name: string;
  emergency_contact_secondary_relation: string;
  emergency_contact_secondary_phone: string;
}

const EMPTY_FORM: ProfileFormState = {
  full_name: '',
  work_email: '',
  date_of_birth: '',
  gender: '',
  marital_status: '',
  spouse_name: '',
  id_number: '',
  address: '',
  city: '',
  country: '',
  mobile: '',
  phone: '',
  email_address: '',
  emergency_contact_primary_name: '',
  emergency_contact_primary_relation: '',
  emergency_contact_primary_phone: '',
  emergency_contact_secondary_name: '',
  emergency_contact_secondary_relation: '',
  emergency_contact_secondary_phone: '',
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

const mapEmployeeToFormState = (employee: Employee): ProfileFormState => {
  const personalInfo = employee.user_personal_info?.[0];
  return {
    full_name: employee.full_name ?? '',
    work_email: employee.work_email ?? '',
    date_of_birth: personalInfo?.date_of_birth
      ? new Date(personalInfo.date_of_birth).toISOString().split('T')[0]
      : '',
    gender: personalInfo?.gender ?? '',
    marital_status: personalInfo?.marital_status ?? '',
    spouse_name: personalInfo?.spouse_name ?? '',
    id_number: personalInfo?.id_number ?? '',
    address: personalInfo?.address ?? '',
    city: personalInfo?.city ?? '',
    country: personalInfo?.country ?? '',
    mobile: personalInfo?.mobile ?? '',
    phone: personalInfo?.phone ?? '',
    email_address: personalInfo?.email_address ?? '',
    emergency_contact_primary_name: personalInfo?.emergency_contact_primary_name ?? '',
    emergency_contact_primary_relation: personalInfo?.emergency_contact_primary_relation ?? '',
    emergency_contact_primary_phone: personalInfo?.emergency_contact_primary_phone ?? '',
    emergency_contact_secondary_name: personalInfo?.emergency_contact_secondary_name ?? '',
    emergency_contact_secondary_relation:
      personalInfo?.emergency_contact_secondary_relation ?? '',
    emergency_contact_secondary_phone: personalInfo?.emergency_contact_secondary_phone ?? '',
  };
};

const formatDate = (value?: string, fallback = 'Non renseignee') => {
  if (!value) {
    return fallback;
  }
  return new Date(value).toLocaleDateString('fr-FR');
};

const formatGender = (value?: string) => {
  switch (value) {
    case 'Male':
      return 'Masculin';
    case 'Female':
      return 'Feminin';
    default:
      return 'Non renseigne';
  }
};

const formatMaritalStatus = (value?: string) => {
  switch (value) {
    case 'Married':
      return 'Marie';
    case 'Single':
      return 'Celibataire';
    case 'Widowed':
      return 'Veuf';
    default:
      return 'Non renseigne';
  }
};

const formatEmploymentType = (value?: string) => {
  switch (value) {
    case 'Full_Time':
      return 'Temps plein';
    case 'Part_Time':
      return 'Temps partiel';
    default:
      return 'Non renseigne';
  }
};

const formatContractType = (value?: string) => {
  switch (value) {
    case 'PERMANENT':
      return 'Permanent';
    case 'FIXED_TERM':
      return 'CDD';
    case 'INTERNSHIP':
      return 'Stage';
    case 'CONTRACTOR':
      return 'Contrat';
    default:
      return 'Non renseigne';
  }
};

const formatContractStatus = (value?: string) => {
  switch (value) {
    case 'ACTIVE':
      return 'Actif';
    case 'DRAFT':
      return 'Brouillon';
    case 'SUSPENDED':
      return 'Suspendu';
    case 'TERMINATED':
      return 'Termine';
    default:
      return 'Non renseigne';
  }
};

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) {
    return 'Non renseigne';
  }
  return value.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  });
};
export default function EmployeeProfile() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<ProfileFormState>(EMPTY_FORM);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { refreshUser } = useAuth();

  const resolveProfilePhoto = useCallback(
    (value?: string | null) => resolveImageUrl(value),
    [],
  );

  const normalizeEmployeeProfile = useCallback(
    (data: Employee): Employee => ({
      ...data,
      profile_photo_url: resolveProfilePhoto(data.profile_photo_url) ?? null,
    }),
    [resolveProfilePhoto],
  );

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await employeesService.getMyProfile();
        if (!response.success) {
          throw new Error(response.message || 'Impossible de recuperer le profil.');
        }
        const profile = response.data as Employee;
        const normalizedProfile = normalizeEmployeeProfile(profile);
        setEmployee(normalizedProfile);
        setFormData(mapEmployeeToFormState(normalizedProfile));
        setProfilePhotoPreview(resolveProfilePhoto(normalizedProfile.profile_photo_url) ?? null);
      } catch (err) {
        const message = getErrorMessage(err, 'Erreur lors de la recuperation du profil.');
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [normalizeEmployeeProfile, resolveProfilePhoto, toast]);

  useEffect(() => {
    return () => {
      if (profilePhotoPreview && profilePhotoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(profilePhotoPreview);
      }
    };
  }, [profilePhotoPreview]);

  const personalInfo = employee?.user_personal_info?.[0];
  const financialInfo = employee?.user_financial_info?.[0];
  const activeContract = useMemo(() => {
    if (!employee?.employment_contract?.length) {
      return null;
    }
    return (
      employee.employment_contract.find((contract) => contract.status === 'ACTIVE') ??
      employee.employment_contract[0]
    );
  }, [employee]);

  const recentDocuments = useMemo(() => {
    if (!employee?.user_document_user_document_user_idTouser?.length) {
      return [] as EmployeeDocument[];
    }
    return [...employee.user_document_user_document_user_idTouser]
      .sort(
        (first, second) =>
          new Date(second.created_at).getTime() - new Date(first.created_at).getTime(),
      )
      .slice(0, 5);
  }, [employee]);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleProfilePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (profilePhotoPreview && profilePhotoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(profilePhotoPreview);
    }

    if (file) {
      setProfilePhotoFile(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
    } else {
      setProfilePhotoFile(null);
      setProfilePhotoPreview(resolveProfilePhoto(employee?.profile_photo_url) ?? null);
    }
  };

  const resetForm = () => {
    if (employee) {
      setFormData(mapEmployeeToFormState(employee));
      setProfilePhotoFile(null);
      setProfilePhotoPreview(resolveProfilePhoto(employee.profile_photo_url) ?? null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: UpdateMyProfilePayload = {};
    (Object.entries(formData) as [keyof ProfileFormState, string][]).forEach(
      ([key, value]) => {
        const trimmed = value.trim();
        if (trimmed !== '') {
          (payload as Record<string, string>)[key] = trimmed;
        }
      },
    );

    if (Object.keys(payload).length === 0 && !profilePhotoFile) {
      toast.info('Aucune modification a enregistrer.');
      return;
    }

    try {
      setSaving(true);
      const response = await employeesService.updateMyProfile(payload, profilePhotoFile);
      if (!response.success) {
        throw new Error(response.message || 'Impossible de mettre a jour le profil.');
      }

      const updatedProfile = response.data as Employee;
      const normalizedProfile = normalizeEmployeeProfile(updatedProfile);
      setEmployee(normalizedProfile);
      setFormData(mapEmployeeToFormState(normalizedProfile));
      setProfilePhotoFile(null);
      setProfilePhotoPreview(resolveProfilePhoto(normalizedProfile.profile_photo_url) ?? null);
      await refreshUser();
      toast.success('Profil mis a jour avec succes.');
    } catch (err) {
      const message = getErrorMessage(err, 'Erreur lors de la mise a jour du profil.');
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Mon Profil" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Chargement du profil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Mon Profil" />
        <ComponentCard title="Erreur">
          <div className="text-center py-8">
            <div className="text-red-500 text-4xl mb-4">!</div>
            <p className="text-red-600 dark:text-red-400 mb-4">
              {error || 'Impossible de charger le profil.'}
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
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Mon Profil" />

      <div className="space-y-6">
        <ComponentCard title="Informations generales">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                {profilePhotoPreview ? (
                  <Image
                    src={profilePhotoPreview}
                    alt={employee.full_name}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  employee.full_name.charAt(0).toUpperCase()
                )}
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
                {employee.full_name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Nom d&apos;utilisateur:
                  </span>
                  <span className="ml-2 text-black dark:text-white">{employee.username}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Email professionnel:
                  </span>
                  <span className="ml-2 text-black dark:text-white">
                    {employee.work_email || 'Non renseigne'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Departement:</span>
                  <span className="ml-2 text-black dark:text-white">
                    {employee.department?.name ||
                      'Non assigne'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Poste:</span>
                  <span className="ml-2 text-black dark:text-white">
                    {employee.position?.title || 'Non defini'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Date d&apos;embauche:
                  </span>
                  <span className="ml-2 text-black dark:text-white">
                    {formatDate(employee.hire_date)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Statut:</span>
                  <span
                    className={`ml-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${employee.active ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                      }`}
                  >
                    {employee.active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ComponentCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ComponentCard title="Informations personnelles">
            {personalInfo ? (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                  <dt className="font-medium text-gray-600 dark:text-gray-400">Date de naissance</dt>
                  <dd className="text-black dark:text-white">
                    {formatDate(personalInfo.date_of_birth)}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600 dark:text-gray-400">Genre</dt>
                  <dd className="text-black dark:text-white">
                    {formatGender(personalInfo.gender)}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600 dark:text-gray-400">Statut marital</dt>
                  <dd className="text-black dark:text-white">
                    {formatMaritalStatus(personalInfo.marital_status)}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600 dark:text-gray-400">Nom du conjoint</dt>
                  <dd className="text-black dark:text-white">
                    {personalInfo.spouse_name || 'Non renseigne'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600 dark:text-gray-400">Numero d&apos;identite</dt>
                  <dd className="text-black dark:text-white">
                    {personalInfo.id_number || 'Non renseigne'}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Aucune information personnelle enregistree.
              </p>
            )}
          </ComponentCard>

          <ComponentCard title="Coordonnees">
            {personalInfo ? (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                  <dt className="font-medium text-gray-600 dark:text-gray-400">Adresse</dt>
                  <dd className="text-black dark:text-white">
                    {personalInfo.address || 'Non renseignee'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600 dark:text-gray-400">Ville</dt>
                  <dd className="text-black dark:text-white">
                    {personalInfo.city || 'Non renseignee'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600 dark:text-gray-400">Pays</dt>
                  <dd className="text-black dark:text-white">
                    {personalInfo.country || 'Non renseigne'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600 dark:text-gray-400">Mobile</dt>
                  <dd className="text-black dark:text-white">
                    {personalInfo.mobile || 'Non renseigne'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600 dark:text-gray-400">Telephone</dt>
                  <dd className="text-black dark:text-white">
                    {personalInfo.phone || 'Non renseigne'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600 dark:text-gray-400">Email personnel</dt>
                  <dd className="text-black dark:text-white">
                    {personalInfo.email_address || 'Non renseigne'}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Aucune coordonnee enregistree.
              </p>
            )}
          </ComponentCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ComponentCard title="Contacts d&apos;urgence">
            {personalInfo?.emergency_contact_primary_name ||
              personalInfo?.emergency_contact_secondary_name ? (
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="font-medium text-gray-600 dark:text-gray-400">
                    Contact principal
                  </dt>
                  <dd className="text-black dark:text-white">
                    {personalInfo?.emergency_contact_primary_name || 'Non renseigne'}
                  </dd>
                  <dd className="text-gray-600 dark:text-gray-400">
                    Relation: {personalInfo?.emergency_contact_primary_relation || 'Non renseignee'}
                  </dd>
                  <dd className="text-gray-600 dark:text-gray-400">
                    Telephone: {personalInfo?.emergency_contact_primary_phone || 'Non renseigne'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600 dark:text-gray-400">
                    Contact secondaire
                  </dt>
                  <dd className="text-black dark:text-white">
                    {personalInfo?.emergency_contact_secondary_name || 'Non renseigne'}
                  </dd>
                  <dd className="text-gray-600 dark:text-gray-400">
                    Relation: {personalInfo?.emergency_contact_secondary_relation || 'Non renseignee'}
                  </dd>
                  <dd className="text-gray-600 dark:text-gray-400">
                    Telephone: {personalInfo?.emergency_contact_secondary_phone || 'Non renseigne'}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Aucun contact d&apos;urgence enregistre.
              </p>
            )}
          </ComponentCard>

          <ComponentCard title="Informations financieres">
            {financialInfo ? (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                  <dt className="font-medium text-gray-600 dark:text-gray-400">Type de contrat</dt>
                  <dd className="text-black dark:text-white">
                    {formatEmploymentType(financialInfo.employment_type)}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600 dark:text-gray-400">Salaire brut</dt>
                  <dd className="text-black dark:text-white">
                    {formatCurrency(financialInfo.salary_gross)}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600 dark:text-gray-400">Salaire net</dt>
                  <dd className="text-black dark:text-white">
                    {formatCurrency(financialInfo.salary_net)}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600 dark:text-gray-400">Banque</dt>
                  <dd className="text-black dark:text-white">
                    {financialInfo.bank_name || 'Non renseignee'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600 dark:text-gray-400">Compte bancaire</dt>
                  <dd className="text-black dark:text-white">
                    {financialInfo.account_number || 'Non renseigne'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600 dark:text-gray-400">IBAN</dt>
                  <dd className="text-black dark:text-white">
                    {financialInfo.iban || 'Non renseigne'}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Aucune information financiere disponible.
              </p>
            )}
          </ComponentCard>
        </div>

        <ComponentCard title="Contrat actif">
          {activeContract ? (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="font-medium text-gray-600 dark:text-gray-400">Type de contrat</dt>
                <dd className="text-black dark:text-white">
                  {formatContractType(activeContract.contract_type)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-600 dark:text-gray-400">Statut</dt>
                <dd className="text-black dark:text-white">
                  {formatContractStatus(activeContract.status)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-600 dark:text-gray-400">Debut</dt>
                <dd className="text-black dark:text-white">
                  {formatDate(activeContract.start_date)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-600 dark:text-gray-400">Fin</dt>
                <dd className="text-black dark:text-white">
                  {formatDate(activeContract.end_date, 'Non renseignee')}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-600 dark:text-gray-400">Heures hebdomadaires</dt>
                <dd className="text-black dark:text-white">
                  {activeContract.weekly_hours ?? 'Non renseigne'}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-600 dark:text-gray-400">Notes</dt>
                <dd className="text-black dark:text-white">
                  {activeContract.notes || 'Aucune note'}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Aucun contrat actif trouve.
            </p>
          )}
        </ComponentCard>

        <ComponentCard title="Documents recents">
          {recentDocuments.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentDocuments.map((document) => (
                <li key={document.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-black dark:text-white">{document.name}</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Ajoute le {formatDate(document.created_at, 'Date inconnue')}
                      {document.user_user_document_uploaded_by_user_idTouser?.full_name
                        ? ` par ${document.user_user_document_uploaded_by_user_idTouser.full_name}`
                        : ''}
                    </p>
                  </div>
                  <a
                    href={document.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-md border border-primary px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                  >
                    Voir
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Aucun document recent disponible.
            </p>
          )}
        </ComponentCard>
        <ComponentCard title="Mettre a jour mon profil">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="full_name">
                  Nom complet
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-transparent dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="work_email">
                  Email professionnel
                </label>
                <input
                  id="work_email"
                  name="work_email"
                  type="email"
                  value={formData.work_email}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-transparent dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="date_of_birth">
                  Date de naissance
                </label>
                <input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-transparent dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="gender">
                  Genre
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-transparent dark:text-white"
                >
                  <option value="">Selectionnez</option>
                  <option value="Male">Masculin</option>
                  <option value="Female">Feminin</option>
                </select>
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  htmlFor="marital_status"
                >
                  Statut marital
                </label>
                <select
                  id="marital_status"
                  name="marital_status"
                  value={formData.marital_status}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-transparent dark:text-white"
                >
                  <option value="">Selectionnez</option>
                  <option value="Single">Celibataire</option>
                  <option value="Married">Marie</option>
                  <option value="Widowed">Veuf</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="spouse_name">
                  Nom du conjoint
                </label>
                <input
                  id="spouse_name"
                  name="spouse_name"
                  type="text"
                  value={formData.spouse_name}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-transparent dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="id_number">
                  Numero d&apos;identite
                </label>
                <input
                  id="id_number"
                  name="id_number"
                  type="text"
                  value={formData.id_number}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-transparent dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="mobile">
                  Mobile
                </label>
                <input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-transparent dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="phone">
                  Telephone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-transparent dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  htmlFor="email_address"
                >
                  Email personnel
                </label>
                <input
                  id="email_address"
                  name="email_address"
                  type="email"
                  value={formData.email_address}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-transparent dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="address">
                Adresse
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-transparent dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="city">
                  Ville
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-transparent dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="country">
                  Pays
                </label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-transparent dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  htmlFor="emergency_contact_primary_name"
                >
                  Contact principal - nom
                </label>
                <input
                  id="emergency_contact_primary_name"
                  name="emergency_contact_primary_name"
                  type="text"
                  value={formData.emergency_contact_primary_name}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-transparent dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  htmlFor="emergency_contact_primary_relation"
                >
                  Contact principal - relation
                </label>
                <input
                  id="emergency_contact_primary_relation"
                  name="emergency_contact_primary_relation"
                  type="text"
                  value={formData.emergency_contact_primary_relation}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-transparent dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  htmlFor="emergency_contact_primary_phone"
                >
                  Contact principal - telephone
                </label>
                <input
                  id="emergency_contact_primary_phone"
                  name="emergency_contact_primary_phone"
                  type="tel"
                  value={formData.emergency_contact_primary_phone}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-transparent dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  htmlFor="emergency_contact_secondary_name"
                >
                  Contact secondaire - nom
                </label>
                <input
                  id="emergency_contact_secondary_name"
                  name="emergency_contact_secondary_name"
                  type="text"
                  value={formData.emergency_contact_secondary_name}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-transparent dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  htmlFor="emergency_contact_secondary_relation"
                >
                  Contact secondaire - relation
                </label>
                <input
                  id="emergency_contact_secondary_relation"
                  name="emergency_contact_secondary_relation"
                  type="text"
                  value={formData.emergency_contact_secondary_relation}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-transparent dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  htmlFor="emergency_contact_secondary_phone"
                >
                  Contact secondaire - telephone
                </label>
                <input
                  id="emergency_contact_secondary_phone"
                  name="emergency_contact_secondary_phone"
                  type="tel"
                  value={formData.emergency_contact_secondary_phone}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-transparent dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="profile_photo">
                Photo de profil
              </label>
              <input
                id="profile_photo"
                name="profile_photo"
                type="file"
                accept="image/*"
                onChange={handleProfilePhotoChange}
                className="w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary/90 dark:text-gray-300"
              />
              {profilePhotoPreview && (
                <div className="mt-2">
                  <Image
                    src={profilePhotoPreview}
                    alt="Apercu de la photo de profil"
                    width={96}
                    height={96}
                    className="h-24 w-24 rounded-full object-cover"
                    unoptimized
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Reinitialiser
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </ComponentCard>
      </div>
    </div>
  );
}

