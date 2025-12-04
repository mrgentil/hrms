"use client";

import { useState, useEffect, useMemo } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { employeesService, Employee, PersonalInfo } from "@/services/employees.service";
import { resolveImageUrl } from "@/lib/images";
import Link from "next/link";

type ProfileWithUser = {
  user: Employee;
  personalInfo: PersonalInfo | null;
};

export default function UserProfiles() {
  const [profiles, setProfiles] = useState<ProfileWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const response = await employeesService.getEmployees({ limit: 100 });
      const profilesData = response.data.map((emp: Employee) => ({
        user: emp,
        personalInfo: emp.user_personal_info?.[0] || null,
      }));
      setProfiles(profilesData);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  // Filtres
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const matchSearch = !search || 
        p.user.full_name.toLowerCase().includes(search.toLowerCase());
      const matchCity = !cityFilter || 
        p.personalInfo?.city?.toLowerCase() === cityFilter.toLowerCase();
      const matchGender = !genderFilter || 
        p.personalInfo?.gender === genderFilter;
      return matchSearch && matchCity && matchGender;
    });
  }, [profiles, search, cityFilter, genderFilter]);

  // Villes uniques
  const cities = useMemo(() => {
    const citySet = new Set<string>();
    profiles.forEach((p) => {
      if (p.personalInfo?.city) citySet.add(p.personalInfo.city);
    });
    return Array.from(citySet);
  }, [profiles]);

  // Stats
  const stats = useMemo(() => ({
    total: profiles.length,
    withProfile: profiles.filter((p) => p.personalInfo).length,
    male: profiles.filter((p) => p.personalInfo?.gender === "Male").length,
    female: profiles.filter((p) => p.personalInfo?.gender === "Female").length,
    married: profiles.filter((p) => p.personalInfo?.marital_status === "Married").length,
  }), [profiles]);

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
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Profils Utilisateurs" />
      
      <div className="space-y-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-3xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-3xl font-bold text-green-600">{stats.withProfile}</div>
            <div className="text-sm text-gray-500">Profils complets</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-3xl font-bold text-blue-600">{stats.male}</div>
            <div className="text-sm text-gray-500">Hommes</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-3xl font-bold text-pink-600">{stats.female}</div>
            <div className="text-sm text-gray-500">Femmes</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-3xl font-bold text-purple-600">{stats.married}</div>
            <div className="text-sm text-gray-500">Mariés</div>
          </div>
        </div>

        {/* Filtres */}
        <ComponentCard title="Recherche et Filtres">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Rechercher par nom
              </label>
              <input
                type="text"
                placeholder="Nom de l'utilisateur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Ville
              </label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              >
                <option value="">Toutes les villes</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Genre
              </label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              >
                <option value="">Tous</option>
                <option value="Male">Homme</option>
                <option value="Female">Femme</option>
              </select>
            </div>
          </div>
        </ComponentCard>

        {/* Liste des profils */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredProfiles.map(({ user, personalInfo }) => (
            <div
              key={user.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Header avec photo */}
              <div className="bg-gradient-to-r from-primary to-blue-600 p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white overflow-hidden">
                    {user.profile_photo_url ? (
                      <img
                        src={resolveImageUrl(user.profile_photo_url)}
                        alt={user.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-xl font-bold">
                        {user.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="text-white">
                    <h3 className="font-semibold text-lg">{user.full_name}</h3>
                    <p className="text-blue-100 text-sm">
                      {user.position?.title || "Poste non défini"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Infos */}
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Genre</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {getGenderLabel(personalInfo?.gender)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">État civil</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {getMaritalLabel(personalInfo?.marital_status)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Date de naissance</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(personalInfo?.date_of_birth)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Ville</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {personalInfo?.city || "Non renseigné"}
                    </p>
                  </div>
                </div>

                {personalInfo?.mobile && (
                  <div className="text-sm">
                    <span className="text-gray-500">Téléphone: </span>
                    <span className="font-medium">{personalInfo.mobile}</span>
                  </div>
                )}

                {personalInfo?.email_address && (
                  <div className="text-sm">
                    <span className="text-gray-500">Email perso: </span>
                    <span className="font-medium">{personalInfo.email_address}</span>
                  </div>
                )}

                {/* Badge si profil incomplet */}
                {!personalInfo && (
                  <div className="bg-yellow-50 text-yellow-700 text-xs px-3 py-1 rounded-full inline-block">
                    Profil incomplet
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="border-t border-gray-100 dark:border-gray-700 p-3 flex justify-end gap-2">
                <Link
                  href={`/users/${user.id}`}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition"
                >
                  Voir
                </Link>
                <Link
                  href={`/users/${user.id}/edit`}
                  className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                >
                  Modifier
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredProfiles.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            Aucun profil trouvé
          </div>
        )}
      </div>
    </div>
  );
}
