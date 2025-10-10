import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";
import { formatUserRole } from "@/lib/roleLabels";

export const metadata: Metadata = {
  title: "Détails Utilisateur | TailAdmin - Dashboard RH",
  description: "Voir les détails d'un utilisateur",
};

export default function UserDetails({ params }: { params: { id: string } }) {
  // Données d'exemple - en réalité, vous récupéreriez ces données via l'API
  const user = {
    id: params.id,
    username: "marie.dupont",
    full_name: "Marie Dupont",
    role: "ROLE_MANAGER",
    department: "Ressources Humaines",
    position: "Manager RH",
    work_email: "marie.dupont@company.com",
    hire_date: "2023-01-15",
    active: true,
    manager: "Jean Martin",
    profile_photo_url: "/images/user/user-01.png",
    personal_info: {
      date_of_birth: "1985-03-15",
      gender: "Female",
      marital_status: "Married",
      mobile: "+33 6 12 34 56 78",
      email_address: "marie.dupont@personal.com",
      address: "123 Rue de la Paix, Paris",
      city: "Paris",
      country: "France",
    },
    employment_history: [
      {
        change_type: "Promotion",
        effective_date: "2023-06-01",
        notes: "Promotion au poste de Manager RH",
      },
      {
        change_type: "Embauche",
        effective_date: "2023-01-15",
        notes: "Embauche initiale",
      },
    ],
  };

  const roleName = formatUserRole(user.role);
  const roleTone =
    user.role === 'ROLE_ADMIN'
      ? 'bg-success text-success'
      : user.role === 'ROLE_MANAGER'
      ? 'bg-warning text-warning'
      : 'bg-primary text-primary';

  return (
    <div>
      <PageBreadcrumb pageTitle={`Détails - ${user.full_name}`} />
      
      <div className="space-y-6">
        {/* Actions rapides */}
        <div className="flex justify-end space-x-4">
          <button className="inline-flex items-center justify-center rounded-md border border-primary px-6 py-3 text-center font-medium text-primary hover:bg-opacity-90">
            Modifier
          </button>
          <button className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-center font-medium text-white hover:bg-opacity-90">
            Envoyer Message
          </button>
        </div>

        {/* Informations principales */}
        <ComponentCard title="Informations Principales">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              <img
                src={user.profile_photo_url}
                alt={user.full_name}
                className="h-24 w-24 rounded-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                    Nom complet
                  </label>
                  <p className="text-black dark:text-white">{user.full_name}</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                    Nom d'utilisateur
                  </label>
                  <p className="text-black dark:text-white">{user.username}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                    Email professionnel
                  </label>
                  <p className="text-black dark:text-white">{user.work_email}</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                    Rôle
                  </label>
                  <span className={`inline-flex rounded-full bg-opacity-10 px-3 py-1 text-sm	font-medium ${roleTone}`}>
                    {roleName}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                    Département
                  </label>
                  <p className="text-black dark:text-white">{user.department}</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                    Poste
                  </label>
                  <p className="text-black dark:text-white">{user.position}</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                    Statut
                  </label>
                  <span className={`inline-flex rounded-full bg-opacity-10 px-3 py-1 text-sm font-medium ${
                    user.active ? 'bg-success text-success' : 'bg-danger text-danger'
                  }`}>
                    {user.active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                    Date d'embauche
                  </label>
                  <p className="text-black dark:text-white">{user.hire_date}</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                    Manager
                  </label>
                  <p className="text-black dark:text-white">{user.manager}</p>
                </div>
              </div>
            </div>
          </div>
        </ComponentCard>

        {/* Informations personnelles */}
        <ComponentCard title="Informations Personnelles">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                  Date de naissance
                </label>
                <p className="text-black dark:text-white">{user.personal_info.date_of_birth}</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                  Genre
                </label>
                <p className="text-black dark:text-white">
                  {user.personal_info.gender === 'Male' ? 'Homme' : 'Femme'}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                  État civil
                </label>
                <p className="text-black dark:text-white">
                  {user.personal_info.marital_status === 'Married' ? 'Marié(e)' : 
                   user.personal_info.marital_status === 'Single' ? 'Célibataire' : 'Veuf/Veuve'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                  Téléphone personnel
                </label>
                <p className="text-black dark:text-white">{user.personal_info.mobile}</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                  Email personnel
                </label>
                <p className="text-black dark:text-white">{user.personal_info.email_address}</p>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                Adresse
              </label>
              <p className="text-black dark:text-white">{user.personal_info.address}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                  Ville
                </label>
                <p className="text-black dark:text-white">{user.personal_info.city}</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                  Pays
                </label>
                <p className="text-black dark:text-white">{user.personal_info.country}</p>
              </div>
            </div>
          </div>
        </ComponentCard>

        {/* Historique d'emploi */}
        <ComponentCard title="Historique d'Emploi">
          <div className="space-y-4">
            {user.employment_history.map((history, index) => (
              <div key={index} className="border-l-4 border-primary pl-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-black dark:text-white">
                    {history.change_type}
                  </h4>
                  <span className="text-sm text-gray-500">
                    {history.effective_date}
                  </span>
                </div>
                <p className="text-sm text-black dark:text-white mt-1">
                  {history.notes}
                </p>
              </div>
            ))}
          </div>
        </ComponentCard>

        {/* Actions */}
        <div className="flex justify-between">
          <button className="inline-flex items-center justify-center rounded-md border border-stroke px-6 py-3 text-center font-medium text-black hover:border-gray-3 dark:border-strokedark dark:text-white">
            Retour à la Liste
          </button>
          <div className="flex space-x-4">
            <button className="inline-flex items-center justify-center rounded-md border border-danger px-6 py-3 text-center font-medium text-danger hover:bg-opacity-90">
              {user.active ? 'Désactiver' : 'Activer'}
            </button>
            <button className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-center font-medium text-white hover:bg-opacity-90">
              Modifier Utilisateur
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
