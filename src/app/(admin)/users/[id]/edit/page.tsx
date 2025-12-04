"use client";

import { useState, useEffect, use } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { authService } from "@/lib/auth";
import { resolveImageUrl } from "@/lib/images";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Department {
  id: number;
  department_name: string;
}

interface Position {
  id: number;
  title: string;
}

interface Manager {
  id: number;
  full_name: string;
}

interface PersonalInfo {
  id?: number;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  mobile?: string;
  email_address?: string;
  address?: string;
  city?: string;
  country?: string;
}

interface UserData {
  id: number;
  username: string;
  full_name: string;
  role: string;
  active: boolean;
  work_email?: string;
  hire_date?: string;
  profile_photo_url?: string;
  department_id?: number;
  position_id?: number;
  manager_id?: number;
  department_user_department_idTodepartment?: Department;
  position?: Position;
  user?: Manager;
  user_personal_info?: PersonalInfo[];
}

interface FormData {
  username: string;
  full_name: string;
  work_email: string;
  password: string;
  role: string;
  department_id: string;
  position_id: string;
  manager_id: string;
  hire_date: string;
  active: boolean;
  // Personal info
  date_of_birth: string;
  gender: string;
  marital_status: string;
  mobile: string;
  email_address: string;
  address: string;
  city: string;
  country: string;
}

const inputClass = "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300";

export default function EditUser({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    username: "",
    full_name: "",
    work_email: "",
    password: "",
    role: "ROLE_EMPLOYEE",
    department_id: "",
    position_id: "",
    manager_id: "",
    hire_date: "",
    active: true,
    date_of_birth: "",
    gender: "",
    marital_status: "",
    mobile: "",
    email_address: "",
    address: "",
    city: "",
    country: "",
  });

  useEffect(() => {
    loadData();
  }, [resolvedParams.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger utilisateur et options en parallèle
      const [userRes, deptRes, posRes, usersRes] = await Promise.all([
        authService.authenticatedFetch(`${API_BASE_URL}/users/${resolvedParams.id}`),
        authService.authenticatedFetch(`${API_BASE_URL}/departments`),
        authService.authenticatedFetch(`${API_BASE_URL}/positions`),
        authService.authenticatedFetch(`${API_BASE_URL}/users?limit=100`),
      ]);

      if (!userRes.ok) throw new Error("Utilisateur non trouvé");

      const userData = (await userRes.json()).data;
      const deptsData = (await deptRes.json()).data || [];
      const posData = (await posRes.json()).data || [];
      const usersData = (await usersRes.json()).data?.users || [];

      setUser(userData);
      setDepartments(deptsData);
      setPositions(posData);
      setManagers(usersData.filter((u: any) => u.id !== userData.id));

      const personalInfo = userData.user_personal_info?.[0] || {};
      
      setFormData({
        username: userData.username || "",
        full_name: userData.full_name || "",
        work_email: userData.work_email || "",
        password: "",
        role: userData.role || "ROLE_EMPLOYEE",
        department_id: userData.department_user_department_idTodepartment?.id?.toString() || "",
        position_id: userData.position?.id?.toString() || "",
        manager_id: userData.user?.id?.toString() || "",
        hire_date: userData.hire_date ? userData.hire_date.split("T")[0] : "",
        active: userData.active ?? true,
        date_of_birth: personalInfo.date_of_birth ? personalInfo.date_of_birth.split("T")[0] : "",
        gender: personalInfo.gender || "",
        marital_status: personalInfo.marital_status || "",
        mobile: personalInfo.mobile || "",
        email_address: personalInfo.email_address || "",
        address: personalInfo.address || "",
        city: personalInfo.city || "",
        country: personalInfo.country || "",
      });
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // Préparer les données utilisateur
      const userPayload: any = {
        username: formData.username,
        full_name: formData.full_name,
        work_email: formData.work_email || undefined,
        role: formData.role,
        active: formData.active,
        department_id: formData.department_id ? parseInt(formData.department_id) : undefined,
        position_id: formData.position_id ? parseInt(formData.position_id) : undefined,
        manager_id: formData.manager_id ? parseInt(formData.manager_id) : undefined,
        hire_date: formData.hire_date || undefined,
      };

      if (formData.password) {
        userPayload.password = formData.password;
      }

      // Mettre à jour l'utilisateur
      const userRes = await authService.authenticatedFetch(
        `${API_BASE_URL}/users/${user.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userPayload),
        }
      );

      if (!userRes.ok) {
        const err = await userRes.json();
        throw new Error(err.message || "Erreur lors de la mise à jour");
      }

      // Mettre à jour les infos personnelles si modifiées
      const personalPayload = {
        date_of_birth: formData.date_of_birth || undefined,
        gender: formData.gender || undefined,
        marital_status: formData.marital_status || undefined,
        mobile: formData.mobile || undefined,
        email_address: formData.email_address || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        country: formData.country || undefined,
      };

      // Check if any personal info is filled
      const hasPersonalInfo = Object.values(personalPayload).some(v => v);
      if (hasPersonalInfo) {
        const existingPersonalInfo = user.user_personal_info?.[0];
        const method = existingPersonalInfo ? "PATCH" : "POST";
        const url = existingPersonalInfo 
          ? `${API_BASE_URL}/personal-info/${existingPersonalInfo.id}`
          : `${API_BASE_URL}/personal-info`;

        await authService.authenticatedFetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...personalPayload, user_id: user.id }),
        });
      }

      setSuccess("Utilisateur mis à jour avec succès !");
      setTimeout(() => router.push(`/users/${user.id}`), 1500);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">{error}</div>
        <Link href="/users" className="text-primary hover:underline">
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle={`Modifier - ${user?.full_name || "Utilisateur"}`} />
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Informations de base */}
        <ComponentCard title="📝 Informations de Base">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Nom d'utilisateur <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className={labelClass}>Email professionnel</label>
                <input
                  type="email"
                  name="work_email"
                  value={formData.work_email}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Nouveau mot de passe
                  <span className="text-gray-400 text-xs ml-2">(laisser vide pour ne pas changer)</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <label className={labelClass}>Rôle</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <optgroup label="🔐 Administration">
                    <option value="ROLE_SUPER_ADMIN">👑 Super Admin</option>
                    <option value="ROLE_ADMIN">⚙️ Administrateur</option>
                  </optgroup>
                  <optgroup label="👥 Gestion">
                    <option value="ROLE_RH">📋 Ressources Humaines</option>
                    <option value="ROLE_MANAGER">👔 Manager</option>
                  </optgroup>
                  <optgroup label="👤 Standard">
                    <option value="ROLE_EMPLOYEE">💼 Employé</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className={labelClass}>Département</label>
                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Sélectionner...</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Poste</label>
                <select
                  name="position_id"
                  value={formData.position_id}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Sélectionner...</option>
                  {positions.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className={labelClass}>Date d'embauche</label>
                <input
                  type="date"
                  name="hire_date"
                  value={formData.hire_date}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Manager</label>
                <select
                  name="manager_id"
                  value={formData.manager_id}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Sélectionner...</option>
                  {managers.map((mgr) => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="active" className="text-gray-700 dark:text-gray-300">
                Utilisateur actif
              </label>
            </div>
          </div>
        </ComponentCard>

        {/* Informations personnelles */}
        <ComponentCard title="👤 Informations Personnelles">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <label className={labelClass}>Date de naissance</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Genre</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Sélectionner...</option>
                  <option value="Male">Homme</option>
                  <option value="Female">Femme</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>État civil</label>
                <select
                  name="marital_status"
                  value={formData.marital_status}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Sélectionner...</option>
                  <option value="Single">Célibataire</option>
                  <option value="Married">Marié(e)</option>
                  <option value="Divorced">Divorcé(e)</option>
                  <option value="Widowed">Veuf/Veuve</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className={labelClass}>Téléphone</label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="+33 6 12 34 56 78"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email personnel</label>
                <input
                  type="email"
                  name="email_address"
                  value={formData.email_address}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Adresse</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className={labelClass}>Ville</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Pays</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </ComponentCard>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Link
            href={`/users/${resolvedParams.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Enregistrement...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sauvegarder
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
