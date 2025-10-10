import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Modifier Utilisateur | TailAdmin - Dashboard RH",
  description: "Modifier les informations d'un utilisateur",
};

export default function EditUser({ params }: { params: { id: string } }) {
  // Données d'exemple - en réalité, vous récupéreriez ces données via l'API
  const user = {
    id: params.id,
    username: "marie.dupont",
    full_name: "Marie Dupont",
    role: "ROLE_MANAGER",
    department_id: "1",
    position_id: "2",
    work_email: "marie.dupont@company.com",
    hire_date: "2023-01-15",
    active: true,
    manager_id: "2",
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
  };

  return (
    <div>
      <PageBreadcrumb pageTitle={`Modifier - ${user.full_name}`} />
      
      <div className="space-y-6">
        {/* Informations de base */}
        <ComponentCard title="Informations de Base">
          <form className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Nom d'utilisateur <span className="text-meta-1">*</span>
                </label>
                <input
                  type="text"
                  defaultValue={user.username}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Nom complet <span className="text-meta-1">*</span>
                </label>
                <input
                  type="text"
                  defaultValue={user.full_name}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Email professionnel <span className="text-meta-1">*</span>
                </label>
                <input
                  type="email"
                  defaultValue={user.work_email}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  placeholder="Laisser vide pour ne pas changer"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Rôle <span className="text-meta-1">*</span>
                </label>
                <select 
                  defaultValue={user.role}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                >
                  <option value="ROLE_ADMIN">Administrateur</option>
                  <option value="ROLE_MANAGER">Manager</option>
                  <option value="ROLE_EMPLOYEE">Employé</option>
                </select>
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Département
                </label>
                <select 
                  defaultValue={user.department_id}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                >
                  <option value="">Sélectionner un département</option>
                  <option value="1">Ressources Humaines</option>
                  <option value="2">Développement</option>
                  <option value="3">Marketing</option>
                  <option value="4">Finance</option>
                </select>
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Poste
                </label>
                <select 
                  defaultValue={user.position_id}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                >
                  <option value="">Sélectionner un poste</option>
                  <option value="1">Développeur Senior</option>
                  <option value="2">Manager RH</option>
                  <option value="3">Designer UX/UI</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Date d'embauche
                </label>
                <input
                  type="date"
                  defaultValue={user.hire_date}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Manager
                </label>
                <select 
                  defaultValue={user.manager_id}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                >
                  <option value="">Sélectionner un manager</option>
                  <option value="1">Marie Dupont</option>
                  <option value="2">Jean Martin</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Photo de profil
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full cursor-pointer rounded-lg border-[1.5px] border-stroke bg-transparent outline-none transition file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-whiter file:px-5 file:py-3 file:hover:bg-primary file:hover:bg-opacity-10 focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-form-strokedark dark:file:bg-white/30 dark:file:text-white dark:focus:border-primary"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                defaultChecked={user.active}
                className="mr-2"
              />
              <label htmlFor="active" className="text-black dark:text-white">
                Utilisateur actif
              </label>
            </div>
          </form>
        </ComponentCard>

        {/* Informations personnelles */}
        <ComponentCard title="Informations Personnelles">
          <form className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Date de naissance
                </label>
                <input
                  type="date"
                  defaultValue={user.personal_info.date_of_birth}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Genre
                </label>
                <select 
                  defaultValue={user.personal_info.gender}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                >
                  <option value="">Sélectionner</option>
                  <option value="Male">Homme</option>
                  <option value="Female">Femme</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  État civil
                </label>
                <select 
                  defaultValue={user.personal_info.marital_status}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                >
                  <option value="">Sélectionner</option>
                  <option value="Single">Célibataire</option>
                  <option value="Married">Marié(e)</option>
                  <option value="Widowed">Veuf/Veuve</option>
                </select>
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Téléphone personnel
                </label>
                <input
                  type="tel"
                  defaultValue={user.personal_info.mobile}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Adresse
              </label>
              <textarea
                rows={3}
                defaultValue={user.personal_info.address}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Ville
                </label>
                <input
                  type="text"
                  defaultValue={user.personal_info.city}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Pays
                </label>
                <input
                  type="text"
                  defaultValue={user.personal_info.country}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>
            </div>
          </form>
        </ComponentCard>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button className="inline-flex items-center justify-center rounded-md border border-stroke px-10 py-4 text-center font-medium text-black hover:border-gray-3 dark:border-strokedark dark:text-white lg:px-8 xl:px-10">
            Annuler
          </button>
          <button className="inline-flex items-center justify-center rounded-md border border-primary px-10 py-4 text-center font-medium text-primary hover:bg-opacity-90 lg:px-8 xl:px-10">
            Enregistrer comme Brouillon
          </button>
          <button className="inline-flex items-center justify-center rounded-md bg-primary px-10 py-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10">
            Sauvegarder les Modifications
          </button>
        </div>
      </div>
    </div>
  );
}
