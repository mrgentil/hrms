"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { 
  useUsers, 
  useUserStats, 
  useDeleteUser, 
  useExportUsers, 
  useImportUsers 
} from "@/hooks/useUsers";
import { formatUserRole, getRoleBadgeClass, getRoleEmoji } from "@/lib/roleLabels";

export default function UsersClient() {
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Hooks pour les données API
  const { data: usersData, isLoading: usersLoading, error: usersError } = useUsers({
    page: currentPage,
    limit: 10,
    search: searchTerm || undefined,
  });

  const { data: statsData, isLoading: statsLoading } = useUserStats();
  
  // Mutations
  const deleteUserMutation = useDeleteUser();
  const exportUsersMutation = useExportUsers();
  const importUsersMutation = useImportUsers();

  // Données des utilisateurs
  const users = usersData?.data || [];
  const totalUsers = usersData?.total || 0;
  
  // Statistiques
  const stats = statsData?.data || {
    total: 0,
    active: 0,
    inactive: 0,
    byRole: {},
    byDepartment: {}
  };

  const handleDeleteUser = (userId: number, userName: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${userName} ?`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleExportUsers = () => {
    exportUsersMutation.mutate('csv');
  };

  const handleImportCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        importUsersMutation.mutate(file);
      }
    };
    input.click();
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset à la première page lors de la recherche
  };

  // Gestion des erreurs avec useEffect
  useEffect(() => {
    if (usersError) {
      const errorMessage = usersError?.response?.status === 404 
        ? "API non disponible. Vérifiez que votre serveur NestJS est démarré sur le port 3001."
        : "Erreur lors du chargement des utilisateurs";
      toast.error(errorMessage);
    }
  }, [usersError, toast]);

  return (
    <div>
      <PageBreadcrumb pageTitle="Gestion Utilisateurs" />
      
      {/* Bannière d'information si API non disponible */}
      {usersError?.response?.status === 404 && (
        <div className="mb-6 rounded-lg bg-yellow-50 border border-yellow-200 p-4 dark:bg-yellow-900/20 dark:border-yellow-700">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                API non disponible
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>L'API NestJS n'est pas accessible. Vérifiez que :</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Votre serveur NestJS est démarré</li>
                  <li>Il fonctionne sur le port 3001</li>
                  <li>L'URL dans .env.local est correcte</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Bouton d'action principal en haut */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black dark:text-white">
          Gestion des Utilisateurs
        </h1>
        <a 
          href="/users/create" 
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-center font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          onClick={() => toast.info("Redirection vers la création d'utilisateur...")}
        >
          <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nouvel Utilisateur
        </a>
      </div>
      
      <div className="space-y-6">
        {/* Statistiques des utilisateurs */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
          <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
              <svg className="fill-primary dark:fill-white" width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 15.1156C4.19376 15.1156 0.825012 8.61876 0.687512 8.34376C0.584387 8.13751 0.584387 7.86251 0.687512 7.65626C0.825012 7.38126 4.19376 0.918762 11 0.918762C17.8063 0.918762 21.175 7.38126 21.3125 7.65626C21.4156 7.86251 21.4156 8.13751 21.3125 8.34376C21.175 8.61876 17.8063 15.1156 11 15.1156ZM2.26876 8.00001C3.02501 9.27189 5.98126 13.5688 11 13.5688C16.0188 13.5688 18.975 9.27189 19.7313 8.00001C18.975 6.72814 16.0188 2.43126 11 2.43126C5.98126 2.43126 3.02501 6.72814 2.26876 8.00001Z" fill=""/>
                <path d="M11 10.9219C9.38438 10.9219 8.07812 9.61562 8.07812 8C8.07812 6.38438 9.38438 5.07812 11 5.07812C12.6156 5.07812 13.9219 6.38438 13.9219 8C13.9219 9.61562 12.6156 10.9219 11 10.9219ZM11 6.625C10.2437 6.625 9.625 7.24375 9.625 8C9.625 8.75625 10.2437 9.375 11 9.375C11.7563 9.375 12.375 8.75625 12.375 8C12.375 7.24375 11.7563 6.625 11 6.625Z" fill=""/>
              </svg>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <h4 className="text-title-md font-bold text-black dark:text-white">
                  {statsLoading ? "..." : stats.total}
                </h4>
                <span className="text-sm font-medium">Total Utilisateurs</span>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
              <svg className="fill-primary dark:fill-white" width="20" height="22" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.7531 16.4312C10.3781 16.4312 9.27808 17.5312 9.27808 18.9062C9.27808 20.2812 10.3781 21.3812 11.7531 21.3812C13.1281 21.3812 14.2281 20.2812 14.2281 18.9062C14.2281 17.5656 13.1281 16.4312 11.7531 16.4312Z" fill=""/>
              </svg>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <h4 className="text-title-md font-bold text-black dark:text-white">
                  {statsLoading ? "..." : stats.active}
                </h4>
                <span className="text-sm font-medium">Utilisateurs Actifs</span>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
              <svg className="fill-primary dark:fill-white" width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.1063 18.0469L19.3875 3.23126C19.2157 1.71876 17.9438 0.584381 16.3969 0.584381H5.56878C4.05628 0.584381 2.78441 1.71876 2.57816 3.23126L0.859406 18.0469C0.756281 18.9063 1.03128 19.7313 1.61566 20.3844C2.20003 21.0375 2.99066 21.3813 3.85003 21.3813H18.1157C18.975 21.3813 19.8 21.0031 20.35 20.3844C20.9344 19.7313 21.2094 18.9063 21.1063 18.0469Z" fill=""/>
              </svg>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <h4 className="text-title-md font-bold text-black dark:text-white">
                  {statsLoading ? "..." : (stats.byRole?.ROLE_MANAGER || 0)}
                </h4>
                <span className="text-sm font-medium">Managers</span>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
              <svg className="fill-primary dark:fill-white" width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.7531 16.4312C10.3781 16.4312 9.27808 17.5312 9.27808 18.9062C9.27808 20.2812 10.3781 21.3812 11.7531 21.3812C13.1281 21.3812 14.2281 20.2812 14.2281 18.9062C14.2281 17.5656 13.1281 16.4312 11.7531 16.4312Z" fill=""/>
              </svg>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <h4 className="text-title-md font-bold text-black dark:text-white">
                  {statsLoading ? "..." : (stats.byRole?.ROLE_EMPLOYEE || 0)}
                </h4>
                <span className="text-sm font-medium">Employés</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <ComponentCard title="Actions Rapides">
          <div className="flex flex-wrap gap-4">
            <a href="/users/create" className="inline-flex items-center justify-center rounded-md bg-primary px-10 py-4 text-center font-medium text-white hover:bg-primary/90 transition-colors lg:px-8 xl:px-10">
              Ajouter Utilisateur
            </a>
            <button 
              onClick={handleImportCSV}
              className="inline-flex items-center justify-center rounded-md border-2 border-primary bg-white px-10 py-4 text-center font-medium text-primary hover:bg-primary hover:text-white dark:bg-boxdark dark:border-primary transition-colors lg:px-8 xl:px-10"
            >
              Importer CSV
            </button>
            <button 
              onClick={handleExportUsers}
              className="inline-flex items-center justify-center rounded-md border-2 border-stroke bg-white px-10 py-4 text-center font-medium text-black hover:bg-gray-100 dark:bg-boxdark dark:border-strokedark dark:text-white dark:hover:bg-gray-700 transition-colors lg:px-8 xl:px-10"
            >
              Exporter
            </button>
          </div>
        </ComponentCard>

        {/* Barre de recherche */}
        <ComponentCard title="Recherche et Filtres">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Rechercher des utilisateurs..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
          </div>
        </ComponentCard>

        {/* Liste des utilisateurs */}
        <ComponentCard title={`Liste des Utilisateurs (${totalUsers} résultats)`}>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                  <th className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                    Nom Complet
                  </th>
                  <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                    Nom d'utilisateur
                  </th>
                  <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                    Rôle
                  </th>
                  <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                    Département
                  </th>
                  <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                    Email
                  </th>
                  <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                    Statut
                  </th>
                  <th className="px-4 py-4 font-medium text-black dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr>
                    <td colSpan={7} className="border-b border-[#eee] px-4 py-8 text-center dark:border-strokedark">
                      <div className="flex items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        <span className="ml-2 text-black dark:text-white">Chargement des utilisateurs...</span>
                      </div>
                    </td>
                  </tr>
                ) : usersError ? (
                  <tr>
                    <td colSpan={7} className="border-b border-[#eee] px-4 py-8 text-center dark:border-strokedark">
                      <div className="text-red-500">
                        <p>Erreur lors du chargement des utilisateurs</p>
                        <button 
                          onClick={() => window.location.reload()} 
                          className="mt-2 text-primary hover:underline"
                        >
                          Réessayer
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border-b border-[#eee] px-4 py-8 text-center dark:border-strokedark">
                      <p className="text-gray-500">Aucun utilisateur trouvé</p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                  const roleName = user.role_info?.name || formatUserRole(user.role);
                  const roleIcon = user.role_info?.icon || getRoleEmoji(user.role);
                  const badgeClass = getRoleBadgeClass(user.role);

                  return (
                  <tr key={user.id}>
                    <td className="border-b border-[#eee] px-4 py-5 pl-9 dark:border-strokedark xl:pl-11">
                      <h5 className="font-medium text-black dark:text-white">
                        {user.full_name}
                      </h5>
                      <p className="text-sm text-gray-500">
                        Embauché le {user.hire_date ? new Date(user.hire_date).toLocaleDateString('fr-FR') : 'N/A'}
                      </p>
                    </td>
                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                      <p className="text-black dark:text-white">
                        {user.username}
                      </p>
                    </td>
                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${badgeClass}`}>
                        <span>{roleIcon}</span>
                        <span>{roleName}</span>
                      </span>
                    </td>
                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                      <p className="text-black dark:text-white">
                        {user.department?.department_name || 'N/A'}
                      </p>
                    </td>
                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                      <p className="text-black dark:text-white">
                        {user.work_email}
                      </p>
                    </td>
                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                      <p className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                        user.active ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'
                      }`}>
                        {user.active ? 'Actif' : 'Inactif'}
                      </p>
                    </td>
                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                      <div className="flex items-center space-x-3.5">
                        <a href={`/users/${user.id}`} className="hover:text-primary" title="Voir détails">
                          <svg
                            className="fill-current"
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M8.99981 14.8219C3.43106 14.8219 0.674805 9.50624 0.562305 9.28124C0.47793 9.11249 0.47793 8.88749 0.562305 8.71874C0.674805 8.49374 3.43106 3.20624 8.99981 3.20624C14.5686 3.20624 17.3248 8.49374 17.4373 8.71874C17.5217 8.88749 17.5217 9.11249 17.4373 9.28124C17.3248 9.50624 14.5686 14.8219 8.99981 14.8219ZM1.85605 8.99999C2.4748 10.0406 4.89356 13.2656 8.99981 13.2656C13.1061 13.2656 15.5248 10.0406 16.1436 8.99999C15.5248 7.95936 13.1061 4.73436 8.99981 4.73436C4.89356 4.73436 2.4748 7.95936 1.85605 8.99999Z"
                              fill=""
                            />
                            <path
                              d="M9 11.3906C7.67812 11.3906 6.60938 10.3219 6.60938 9C6.60938 7.67813 7.67812 6.60938 9 6.60938C10.3219 6.60938 11.3906 7.67813 11.3906 9C11.3906 10.3219 10.3219 11.3906 9 11.3906ZM9 8.10938C8.50313 8.10938 8.10938 8.50313 8.10938 9C8.10938 9.49688 8.50313 9.89063 9 9.89063C9.49688 9.89063 9.89063 9.49688 9.89063 9C9.89063 8.50313 9.49688 8.10938 9 8.10938Z"
                              fill=""
                            />
                          </svg>
                        </a>
                        <a href={`/users/${user.id}/edit`} className="hover:text-primary" title="Modifier">
                          <svg
                            className="fill-current"
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M8.99981 14.8219C3.43106 14.8219 0.674805 9.50624 0.562305 9.28124C0.47793 9.11249 0.47793 8.88749 0.562305 8.71874C0.674805 8.49374 3.43106 3.20624 8.99981 3.20624C14.5686 3.20624 17.3248 8.49374 17.4373 8.71874C17.5217 8.88749 17.5217 9.11249 17.4373 9.28124C17.3248 9.50624 14.5686 14.8219 8.99981 14.8219Z"
                              fill=""
                            />
                          </svg>
                        </a>
                        <button 
                          onClick={() => handleDeleteUser(user.id, user.full_name)}
                          className="hover:text-danger" 
                          title="Supprimer"
                        >
                          <svg
                            className="fill-current"
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M13.7535 2.47502H11.5879V1.9969C11.5879 1.15315 10.9129 0.478149 10.0691 0.478149H7.90352C7.05977 0.478149 6.38477 1.15315 6.38477 1.9969V2.47502H4.21914C3.40352 2.47502 2.72852 3.15002 2.72852 3.96565V4.8094C2.72852 5.42815 3.09414 5.9344 3.62852 6.1594L4.07852 15.4688C4.13477 16.6219 5.09102 17.5219 6.24414 17.5219H11.7004C12.8535 17.5219 13.8098 16.6219 13.866 15.4688L14.3441 6.13127C14.8785 5.90627 15.2441 5.3719 15.2441 4.78127V3.93752C15.2441 3.15002 14.5691 2.47502 13.7535 2.47502Z"
                              fill=""
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                  })
                )}
              </tbody>
            </table>
          </div>
        </ComponentCard>
      </div>

      {/* Bouton flottant pour ajouter un utilisateur */}
      <a
        href="/users/create"
        className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 hover:scale-110"
        title="Ajouter un nouvel utilisateur"
        onClick={() => toast.info("Redirection vers la création d'utilisateur...")}
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </a>
    </div>
  );
}
