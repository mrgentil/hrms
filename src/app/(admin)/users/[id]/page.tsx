"use client";

import { useState, useEffect, use } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { formatUserRole, getRoleBadgeClass, getRoleEmoji } from "@/lib/roleLabels";
import { authService } from "@/lib/auth";
import { resolveImageUrl } from "@/lib/images";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface UserData {
  id: number;
  username: string;
  full_name: string;
  role: string;
  active: boolean;
  work_email?: string;
  hire_date?: string;
  profile_photo_url?: string;
  department_user_department_idTodepartment?: {
    id: number;
    department_name: string;
  };
  position?: {
    id: number;
    title: string;
  };
  user?: {
    id: number;
    full_name: string;
  };
  role_relation?: {
    id: number;
    name: string;
    color?: string;
  };
  user_personal_info?: Array<{
    date_of_birth?: string;
    gender?: string;
    marital_status?: string;
    mobile?: string;
    email_address?: string;
    address?: string;
    city?: string;
    country?: string;
  }>;
  user_employment_history?: Array<{
    change_type: string;
    effective_date: string;
    notes?: string;
  }>;
  user_document_user_document_user_idTouser?: Array<{
    id: number;
    name: string;
    document_type?: string;
  }>;
}

export default function UserDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadUser();
  }, [resolvedParams.id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/users/${resolvedParams.id}`
      );
      if (!response.ok) {
        throw new Error("Utilisateur non trouvé");
      }
      const result = await response.json();
      setUser(result.data);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    try {
      setToggling(true);
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/users/${user.id}/toggle-status`,
        { method: "PATCH" }
      );
      if (response.ok) {
        setUser({ ...user, active: !user.active });
      }
    } catch (err) {
      console.error("Erreur toggle status:", err);
    } finally {
      setToggling(false);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "Non renseigné";
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const getGenderLabel = (gender?: string) => {
    if (!gender) return "Non renseigné";
    return gender === "Male" ? "Homme" : "Femme";
  };

  const getMaritalLabel = (status?: string) => {
    if (!status) return "Non renseigné";
    switch (status) {
      case "Married": return "Marié(e)";
      case "Single": return "Célibataire";
      case "Widowed": return "Veuf/Veuve";
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
          <div className="flex gap-6">
            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-4">
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">{error || "Utilisateur non trouvé"}</div>
        <Link href="/users" className="text-primary hover:underline">
          Retour à la liste
        </Link>
      </div>
    );
  }

  const personalInfo = user.user_personal_info?.[0];
  const roleName = user.role_relation?.name || formatUserRole(user.role);
  const roleIcon = getRoleEmoji(user.role);
  const badgeClass = getRoleBadgeClass(user.role);

  return (
    <div>
      <PageBreadcrumb pageTitle={`Détails - ${user.full_name}`} />
      
      <div className="space-y-6">
        {/* Actions rapides */}
        <div className="flex justify-end gap-3">
          <Link
            href={`/users/${user.id}/edit`}
            className="inline-flex items-center gap-2 rounded-lg border border-primary px-5 py-2.5 text-primary hover:bg-primary hover:text-white transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Modifier
          </Link>
        </div>

        {/* Informations principales */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Header avec photo */}
          <div className="bg-gradient-to-r from-primary to-blue-600 p-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-white overflow-hidden ring-4 ring-white/30">
                {user.profile_photo_url ? (
                  <img
                    src={resolveImageUrl(user.profile_photo_url)}
                    alt={user.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-3xl font-bold">
                    {user.full_name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold">{user.full_name}</h2>
                <p className="text-blue-100">@{user.username}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${badgeClass}`}>
                    <span>{roleIcon}</span>
                    <span>{roleName}</span>
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.active 
                      ? "bg-green-100 text-green-700" 
                      : "bg-red-100 text-red-700"
                  }`}>
                    {user.active ? "Actif" : "Inactif"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Détails */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-sm text-gray-500">Email professionnel</label>
              <p className="font-medium text-gray-900 dark:text-white">
                {user.work_email || "Non renseigné"}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Département</label>
              <p className="font-medium text-gray-900 dark:text-white">
                {user.department_user_department_idTodepartment?.department_name || "Non assigné"}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Poste</label>
              <p className="font-medium text-gray-900 dark:text-white">
                {user.position?.title || "Non défini"}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Date d'embauche</label>
              <p className="font-medium text-gray-900 dark:text-white">
                {formatDate(user.hire_date)}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Manager</label>
              <p className="font-medium text-gray-900 dark:text-white">
                {user.user?.full_name || "Non assigné"}
              </p>
            </div>
          </div>
        </div>

        {/* Informations personnelles */}
        <ComponentCard title="📋 Informations Personnelles">
          {personalInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="text-sm text-gray-500">Date de naissance</label>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDate(personalInfo.date_of_birth)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Genre</label>
                <p className="font-medium text-gray-900 dark:text-white">
                  {getGenderLabel(personalInfo.gender)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">État civil</label>
                <p className="font-medium text-gray-900 dark:text-white">
                  {getMaritalLabel(personalInfo.marital_status)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Téléphone</label>
                <p className="font-medium text-gray-900 dark:text-white">
                  {personalInfo.mobile || "Non renseigné"}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Email personnel</label>
                <p className="font-medium text-gray-900 dark:text-white">
                  {personalInfo.email_address || "Non renseigné"}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Ville</label>
                <p className="font-medium text-gray-900 dark:text-white">
                  {personalInfo.city || "Non renseigné"}
                </p>
              </div>
              {personalInfo.address && (
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="text-sm text-gray-500">Adresse</label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {personalInfo.address}
                    {personalInfo.city && `, ${personalInfo.city}`}
                    {personalInfo.country && `, ${personalInfo.country}`}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              Aucune information personnelle renseignée
            </p>
          )}
        </ComponentCard>

        {/* Historique d'emploi */}
        {user.user_employment_history && user.user_employment_history.length > 0 && (
          <ComponentCard title="📜 Historique d'Emploi">
            <div className="space-y-4">
              {user.user_employment_history.map((history, index) => (
                <div key={index} className="border-l-4 border-primary pl-4 py-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {history.change_type}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {formatDate(history.effective_date)}
                    </span>
                  </div>
                  {history.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {history.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ComponentCard>
        )}

        {/* Documents */}
        {user.user_document_user_document_user_idTouser && user.user_document_user_document_user_idTouser.length > 0 && (
          <ComponentCard title="📄 Documents">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {user.user_document_user_document_user_idTouser.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{doc.name}</p>
                    <p className="text-xs text-gray-500">{doc.document_type || "Document"}</p>
                  </div>
                </div>
              ))}
            </div>
          </ComponentCard>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Link
            href="/users"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour à la liste
          </Link>
          <div className="flex gap-3">
            <button
              onClick={handleToggleStatus}
              disabled={toggling}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg transition ${
                user.active
                  ? "border border-red-300 text-red-600 hover:bg-red-50"
                  : "border border-green-300 text-green-600 hover:bg-green-50"
              }`}
            >
              {toggling ? "..." : user.active ? "Désactiver" : "Activer"}
            </button>
            <Link
              href={`/users/${user.id}/edit`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
            >
              Modifier
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
