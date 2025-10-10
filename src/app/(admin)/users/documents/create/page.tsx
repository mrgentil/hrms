import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Ajouter Document | TailAdmin - Dashboard RH",
  description: "Ajouter un nouveau document utilisateur",
};

export default function CreateDocument() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Ajouter Nouveau Document" />
      
      <div className="space-y-6">
        {/* Informations du document */}
        <ComponentCard title="Informations du Document">
          <form className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Nom du document <span className="text-meta-1">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: CV_Marie_Dupont.pdf"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Type de document <span className="text-meta-1">*</span>
                </label>
                <select className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary">
                  <option value="">Sélectionner un type</option>
                  <option value="CV">CV</option>
                  <option value="Contrat">Contrat</option>
                  <option value="Certificat">Certificat</option>
                  <option value="Diplôme">Diplôme</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Utilisateur <span className="text-meta-1">*</span>
              </label>
              <select className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary">
                <option value="">Sélectionner un utilisateur</option>
                <option value="1">Marie Dupont</option>
                <option value="2">Jean Martin</option>
                <option value="3">Sophie Laurent</option>
              </select>
            </div>

            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Fichier <span className="text-meta-1">*</span>
              </label>
              <input
                type="file"
                className="w-full cursor-pointer rounded-lg border-[1.5px] border-stroke bg-transparent outline-none transition file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-whiter file:px-5 file:py-3 file:hover:bg-primary file:hover:bg-opacity-10 focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-form-strokedark dark:file:bg-white/30 dark:file:text-white dark:focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Description du document..."
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              ></textarea>
            </div>

            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Date d'expiration
              </label>
              <input
                type="date"
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_confidential"
                className="mr-3"
              />
              <label htmlFor="is_confidential" className="text-black dark:text-white">
                Document confidentiel
              </label>
            </div>
          </form>
        </ComponentCard>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <a href="/users/documents" className="inline-flex items-center justify-center rounded-md border border-stroke px-10 py-4 text-center font-medium text-black hover:border-gray-3 dark:border-strokedark dark:text-white lg:px-8 xl:px-10">
            Annuler
          </a>
          <button className="inline-flex items-center justify-center rounded-md bg-primary px-10 py-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10">
            Ajouter Document
          </button>
        </div>
      </div>
    </div>
  );
}
