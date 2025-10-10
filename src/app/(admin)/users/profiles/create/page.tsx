import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Créer Profil | TailAdmin - Dashboard RH",
  description: "Créer un nouveau profil utilisateur",
};

export default function CreateProfile() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Créer Nouveau Profil" />
      
      <div className="space-y-6">
        {/* Sélection utilisateur */}
        <ComponentCard title="Sélection Utilisateur">
          <form className="space-y-6">
            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Utilisateur <span className="text-meta-1">*</span>
              </label>
              <select className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary">
                <option value="">Sélectionner un utilisateur</option>
                <option value="1">Marie Dupont (marie.dupont@company.com)</option>
                <option value="2">Jean Martin (jean.martin@company.com)</option>
                <option value="3">Sophie Laurent (sophie.laurent@company.com)</option>
              </select>
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
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Genre
                </label>
                <select className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary">
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
                <select className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary">
                  <option value="">Sélectionner</option>
                  <option value="Single">Célibataire</option>
                  <option value="Married">Marié(e)</option>
                  <option value="Widowed">Veuf/Veuve</option>
                </select>
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Nom du père
                </label>
                <input
                  type="text"
                  placeholder="Nom du père"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Numéro d'identité
                </label>
                <input
                  type="text"
                  placeholder="Numéro de carte d'identité"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Téléphone personnel
                </label>
                <input
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Email personnel
              </label>
              <input
                type="email"
                placeholder="email.personnel@example.com"
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              />
            </div>
          </form>
        </ComponentCard>

        {/* Adresse */}
        <ComponentCard title="Adresse">
          <form className="space-y-6">
            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Adresse complète
              </label>
              <textarea
                rows={3}
                placeholder="Adresse complète avec numéro, rue, etc."
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
                  placeholder="Ville"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Pays
                </label>
                <input
                  type="text"
                  placeholder="Pays"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Téléphone fixe
              </label>
              <input
                type="tel"
                placeholder="+33 1 23 45 67 89"
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              />
            </div>
          </form>
        </ComponentCard>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <a href="/users/profiles" className="inline-flex items-center justify-center rounded-md border border-stroke px-10 py-4 text-center font-medium text-black hover:border-gray-3 dark:border-strokedark dark:text-white lg:px-8 xl:px-10">
            Annuler
          </a>
          <button className="inline-flex items-center justify-center rounded-md border border-primary px-10 py-4 text-center font-medium text-primary hover:bg-opacity-90 lg:px-8 xl:px-10">
            Enregistrer comme Brouillon
          </button>
          <button className="inline-flex items-center justify-center rounded-md bg-primary px-10 py-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10">
            Créer Profil
          </button>
        </div>
      </div>
    </div>
  );
}
