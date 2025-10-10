import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Documents Utilisateurs | TailAdmin - Dashboard RH",
  description: "Gestion des documents des utilisateurs",
};

export default function UserDocuments() {
  const documents = [
    {
      id: 1,
      name: "CV_Marie_Dupont.pdf",
      document_type: "CV",
      user_name: "Marie Dupont",
      is_confidential: false,
      uploaded_date: "2023-01-15",
      expires_at: null,
      file_size: "2.5 MB",
    },
    {
      id: 2,
      name: "Contrat_Jean_Martin.pdf",
      document_type: "Contrat",
      user_name: "Jean Martin",
      is_confidential: true,
      uploaded_date: "2023-03-20",
      expires_at: "2024-03-20",
      file_size: "1.8 MB",
    },
  ];

  return (
    <div>
      <PageBreadcrumb pageTitle="Documents Utilisateurs" />
      
      <div className="space-y-6">
        <ComponentCard title="Actions Rapides">
          <div className="flex flex-wrap gap-4">
            <a href="/users/documents/create" className="inline-flex items-center justify-center rounded-md bg-primary px-10 py-4 text-center font-medium text-white hover:bg-primary/90 transition-colors">
              Ajouter Document
            </a>
            <button className="inline-flex items-center justify-center rounded-md border-2 border-primary bg-white px-10 py-4 text-center font-medium text-primary hover:bg-primary hover:text-white dark:bg-boxdark dark:border-primary transition-colors">
              Télécharger Multiple
            </button>
            <button className="inline-flex items-center justify-center rounded-md border-2 border-stroke bg-white px-10 py-4 text-center font-medium text-black hover:bg-gray-100 dark:bg-boxdark dark:border-strokedark dark:text-white dark:hover:bg-gray-700 transition-colors">
              Rechercher
            </button>
          </div>
        </ComponentCard>

        <ComponentCard title="Liste des Documents">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                  <th className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                    Nom du Document
                  </th>
                  <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                    Type
                  </th>
                  <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                    Utilisateur
                  </th>
                  <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                    Confidentialité
                  </th>
                  <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                    Date Upload
                  </th>
                  <th className="px-4 py-4 font-medium text-black dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, key) => (
                  <tr key={key}>
                    <td className="border-b border-[#eee] px-4 py-5 pl-9 dark:border-strokedark xl:pl-11">
                      <h5 className="font-medium text-black dark:text-white">
                        {doc.name}
                      </h5>
                      <p className="text-sm">{doc.file_size}</p>
                    </td>
                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                      <p className="text-black dark:text-white">
                        {doc.document_type}
                      </p>
                    </td>
                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                      <p className="text-black dark:text-white">
                        {doc.user_name}
                      </p>
                    </td>
                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                      <p className={`inline-flex rounded-full bg-opacity-10 px-3 py-1 text-sm font-medium ${
                        doc.is_confidential 
                          ? 'bg-danger text-danger'
                          : 'bg-success text-success'
                      }`}>
                        {doc.is_confidential ? 'Confidentiel' : 'Public'}
                      </p>
                    </td>
                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                      <p className="text-black dark:text-white">
                        {doc.uploaded_date}
                      </p>
                    </td>
                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                      <div className="flex items-center space-x-3.5">
                        <a href={`/users/documents/${doc.id}`} className="hover:text-primary" title="Voir détails">
                          <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18">
                            <path d="M8.99981 14.8219C3.43106 14.8219 0.674805 9.50624 0.562305 9.28124C0.47793 9.11249 0.47793 8.88749 0.562305 8.71874C0.674805 8.49374 3.43106 3.20624 8.99981 3.20624C14.5686 3.20624 17.3248 8.49374 17.4373 8.71874C17.5217 8.88749 17.5217 9.11249 17.4373 9.28124C17.3248 9.50624 14.5686 14.8219 8.99981 14.8219Z"/>
                          </svg>
                        </a>
                        <button className="hover:text-primary" title="Télécharger">
                          <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18">
                            <path d="M16.8754 11.6719C16.5379 11.6719 16.2285 11.9531 16.2285 12.3187V14.8219C16.2285 15.075 16.0316 15.2719 15.7785 15.2719H2.22227C1.96914 15.2719 1.77227 15.075 1.77227 14.8219V12.3187C1.77227 11.9812 1.49102 11.6719 1.12539 11.6719C0.759766 11.6719 0.478516 11.9531 0.478516 12.3187V14.8219C0.478516 15.7781 1.23789 16.5375 2.19414 16.5375H15.7785C16.7348 16.5375 17.4941 15.7781 17.4941 14.8219V12.3187C17.5223 11.9531 17.2129 11.6719 16.8754 11.6719Z"/>
                          </svg>
                        </button>
                        <a href={`/users/documents/${doc.id}/edit`} className="hover:text-primary" title="Modifier">
                          <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18">
                            <path d="M13.7535 2.47502H11.5879V1.9969C11.5879 1.15315 10.9129 0.478149 10.0691 0.478149H7.90352C7.05977 0.478149 6.38477 1.15315 6.38477 1.9969V2.47502H4.21914C3.40352 2.47502 2.72852 3.15002 2.72852 3.96565V4.8094C2.72852 5.42815 3.09414 5.9344 3.62852 6.1594L4.07852 15.4688C4.13477 16.6219 5.09102 17.5219 6.24414 17.5219H11.7004C12.8535 17.5219 13.8098 16.6219 13.866 15.4688L14.3441 6.13127C14.8785 5.90627 15.2441 5.3719 15.2441 4.78127V3.93752C15.2441 3.15002 14.5691 2.47502 13.7535 2.47502Z"/>
                          </svg>
                        </a>
                        <button className="hover:text-danger" title="Supprimer">
                          <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18">
                            <path d="M13.7535 2.47502H11.5879V1.9969C11.5879 1.15315 10.9129 0.478149 10.0691 0.478149H7.90352C7.05977 0.478149 6.38477 1.15315 6.38477 1.9969V2.47502H4.21914C3.40352 2.47502 2.72852 3.15002 2.72852 3.96565V4.8094C2.72852 5.42815 3.09414 5.9344 3.62852 6.1594L4.07852 15.4688C4.13477 16.6219 5.09102 17.5219 6.24414 17.5219H11.7004C12.8535 17.5219 13.8098 16.6219 13.866 15.4688L14.3441 6.13127C14.8785 5.90627 15.2441 5.3719 15.2441 4.78127V3.93752C15.2441 3.15002 14.5691 2.47502 13.7535 2.47502Z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
