import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Profils Utilisateurs | TailAdmin - Dashboard RH",
  description: "Gestion des profils et informations personnelles des utilisateurs",
};

export default function UserProfiles() {
  const profiles = [
    {
      id: 1,
      user_name: "Marie Dupont",
      date_of_birth: "1985-03-15",
      gender: "Female",
      marital_status: "Married",
      address: "123 Rue de la Paix, Paris",
      city: "Paris",
      country: "France",
      mobile: "+33 6 12 34 56 78",
      email_address: "marie.dupont@personal.com",
    },
    {
      id: 2,
      user_name: "Jean Martin",
      date_of_birth: "1990-07-22",
      gender: "Male",
      marital_status: "Single",
      address: "456 Avenue des Champs, Lyon",
      city: "Lyon",
      country: "France",
      mobile: "+33 6 98 76 54 32",
      email_address: "jean.martin@personal.com",
    },
  ];

  return (
    <div>
      <PageBreadcrumb pageTitle="Profils Utilisateurs" />
      
      <div className="space-y-6">
        {/* Actions rapides */}
        <ComponentCard title="Actions Rapides">
          <div className="flex flex-wrap gap-4">
            <a href="/users/profiles/create" className="inline-flex items-center justify-center rounded-md bg-primary px-10 py-4 text-center font-medium text-white hover:bg-primary/90 transition-colors">
              Créer Profil
            </a>
            <button className="inline-flex items-center justify-center rounded-md border-2 border-primary bg-white px-10 py-4 text-center font-medium text-primary hover:bg-primary hover:text-white dark:bg-boxdark dark:border-primary transition-colors">
              Importer Profils
            </button>
            <button className="inline-flex items-center justify-center rounded-md border-2 border-stroke bg-white px-10 py-4 text-center font-medium text-black hover:bg-gray-100 dark:bg-boxdark dark:border-strokedark dark:text-white dark:hover:bg-gray-700 transition-colors">
              Exporter
            </button>
          </div>
        </ComponentCard>

        {/* Filtres et recherche */}
        <ComponentCard title="Recherche et Filtres">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Rechercher par nom
              </label>
              <input
                type="text"
                placeholder="Nom de l'utilisateur..."
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Ville
              </label>
              <select className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary">
                <option value="">Toutes les villes</option>
                <option value="Paris">Paris</option>
                <option value="Lyon">Lyon</option>
                <option value="Marseille">Marseille</option>
              </select>
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                État civil
              </label>
              <select className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary">
                <option value="">Tous</option>
                <option value="Single">Célibataire</option>
                <option value="Married">Marié(e)</option>
                <option value="Widowed">Veuf/Veuve</option>
              </select>
            </div>
          </div>
        </ComponentCard>

        {/* Liste des profils */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {profiles.map((profile) => (
            <ComponentCard key={profile.id} title={`Profil de ${profile.user_name}`}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                      Date de naissance
                    </label>
                    <p className="text-black dark:text-white">{profile.date_of_birth}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                      Genre
                    </label>
                    <p className="text-black dark:text-white">
                      {profile.gender === 'Male' ? 'Homme' : 'Femme'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                      État civil
                    </label>
                    <p className="text-black dark:text-white">
                      {profile.marital_status === 'Married' ? 'Marié(e)' : 
                       profile.marital_status === 'Single' ? 'Célibataire' : 'Veuf/Veuve'}
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                      Ville
                    </label>
                    <p className="text-black dark:text-white">{profile.city}</p>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                    Adresse
                  </label>
                  <p className="text-black dark:text-white">{profile.address}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                      Téléphone
                    </label>
                    <p className="text-black dark:text-white">{profile.mobile}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                      Email personnel
                    </label>
                    <p className="text-black dark:text-white">{profile.email_address}</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <a href={`/users/profiles/${profile.id}`} className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-transparent px-6 py-2 text-center font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors">
                    Voir Détails
                  </a>
                  <a href={`/users/profiles/${profile.id}/edit`} className="inline-flex items-center justify-center rounded-md border border-primary bg-transparent px-6 py-2 text-center font-medium text-primary hover:bg-primary hover:text-white transition-colors">
                    Modifier
                  </a>
                  <button className="inline-flex items-center justify-center rounded-md bg-red-600 px-6 py-2 text-center font-medium text-white hover:bg-red-700 transition-colors">
                    Supprimer
                  </button>
                </div>
              </div>
            </ComponentCard>
          ))}
        </div>

        {/* Statistiques des profils */}
        <ComponentCard title="Statistiques des Profils">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <h4 className="text-title-md font-bold text-black dark:text-white">
                    {profiles.length}
                  </h4>
                  <span className="text-sm font-medium">Profils Complets</span>
                </div>
              </div>
            </div>
            <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <h4 className="text-title-md font-bold text-black dark:text-white">
                    {profiles.filter(p => p.marital_status === 'Married').length}
                  </h4>
                  <span className="text-sm font-medium">Mariés</span>
                </div>
              </div>
            </div>
            <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <h4 className="text-title-md font-bold text-black dark:text-white">
                    {profiles.filter(p => p.gender === 'Male').length}
                  </h4>
                  <span className="text-sm font-medium">Hommes</span>
                </div>
              </div>
            </div>
            <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <h4 className="text-title-md font-bold text-black dark:text-white">
                    {profiles.filter(p => p.gender === 'Female').length}
                  </h4>
                  <span className="text-sm font-medium">Femmes</span>
                </div>
              </div>
            </div>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
