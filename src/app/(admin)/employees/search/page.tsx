'use client';

import { useState, useEffect, useCallback } from 'react';
import { employeesService, Employee } from '@/services/employees.service';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import Link from 'next/link';

export default function EmployeeSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const toast = useToast();

  // Debounce la recherche pour éviter trop d'appels API
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const performSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      const response = await employeesService.searchEmployees(query.trim());

      if (response.success) {
        setSearchResults(response.data);
        setHasSearched(true);
      } else {
        toast.error(response.message || 'Erreur lors de la recherche');
        setSearchResults([]);
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Erreur lors de la recherche';
      toast.error(message);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    performSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery, performSearch]);

  const EmployeeResultCard = ({ employee }: { employee: Employee }) => (
    <div className="bg-white dark:bg-boxdark rounded-lg shadow-md p-6 border border-stroke dark:border-strokedark hover:shadow-lg transition-shadow">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
            {employee.profile_photo_url ? (
              <img
                src={employee.profile_photo_url}
                alt={employee.full_name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              employee.full_name.charAt(0).toUpperCase()
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-1">
                {employee.full_name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                @{employee.username}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${employee.active
                  ? 'bg-success/10 text-success'
                  : 'bg-danger/10 text-danger'
                }`}>
                {employee.active ? 'Actif' : 'Inactif'}
              </span>
              <Link
                href={`/employees/${employee.id}`}
                className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-primary/90"
              >
                Voir profil
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <div className="space-y-2">
                {employee.position && (
                  <div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Poste:</span>
                    <span className="ml-2 text-sm text-black dark:text-white">
                      {employee.position.title}
                      {employee.position.level && (
                        <span className="text-gray-500"> ({employee.position.level})</span>
                      )}
                    </span>
                  </div>
                )}

                {employee.department && (
                  <div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Département:</span>
                    <span className="ml-2 text-sm text-black dark:text-white">
                      {employee.department?.name || 'N/A'}
                    </span>
                  </div>
                )}

                {employee.role_relation && (
                  <div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Rôle:</span>
                    <span className="ml-2 inline-flex items-center">
                      {employee.role_relation.icon && (
                        <span className="mr-1">{employee.role_relation.icon}</span>
                      )}
                      <span
                        className="text-sm font-medium"
                        style={{ color: employee.role_relation.color || undefined }}
                      >
                        {employee.role_relation.name}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="space-y-2">
                {employee.work_email && (
                  <div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="ml-2 text-sm text-black dark:text-white">
                      {employee.work_email}
                    </span>
                  </div>
                )}

                {employee.user_personal_info?.[0]?.mobile && (
                  <div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Téléphone:</span>
                    <span className="ml-2 text-sm text-black dark:text-white">
                      {employee.user_personal_info[0].mobile}
                    </span>
                  </div>
                )}

                {employee.hire_date && (
                  <div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Embauché le:</span>
                    <span className="ml-2 text-sm text-black dark:text-white">
                      {new Date(employee.hire_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {employee.user && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Manager:</span>
              <span className="ml-2 text-sm text-black dark:text-white">
                {employee.user.full_name}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <PageBreadcrumb pageTitle="Recherche d'employés" />

      <div className="space-y-6">
        {/* Barre de recherche */}
        <ComponentCard title="Rechercher un employé">
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Rechercher par nom, email, département, poste..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded border border-stroke px-4 py-3 text-sm outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                autoFocus
              />
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              💡 Vous pouvez rechercher par nom, nom d'utilisateur, email, département, poste, téléphone...
              Tapez au moins 2 caractères pour commencer la recherche.
            </div>
          </div>
        </ComponentCard>

        {/* Résultats de recherche */}
        <ComponentCard title={`Résultats de recherche ${hasSearched ? `(${searchResults.length})` : ''}`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Recherche en cours...</p>
              </div>
            </div>
          ) : !hasSearched ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <p className="text-gray-600 dark:text-gray-400">
                Tapez dans la barre de recherche pour trouver des employés
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">😔</div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Aucun employé trouvé pour "{searchQuery}"
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Essayez avec d'autres mots-clés ou vérifiez l'orthographe
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((employee) => (
                <EmployeeResultCard key={employee.id} employee={employee} />
              ))}
            </div>
          )}
        </ComponentCard>

        {/* Conseils de recherche */}
        {!hasSearched && (
          <ComponentCard title="Conseils de recherche">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-black dark:text-white mb-3">Types de recherche supportés:</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• <strong>Nom complet:</strong> "Jean Dupont"</li>
                  <li>• <strong>Nom d'utilisateur:</strong> "jdupont"</li>
                  <li>• <strong>Email:</strong> "jean.dupont@entreprise.com"</li>
                  <li>• <strong>Département:</strong> "Ressources Humaines"</li>
                  <li>• <strong>Poste:</strong> "Développeur Senior"</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-black dark:text-white mb-3">Astuces:</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• La recherche n'est pas sensible à la casse</li>
                  <li>• Vous pouvez rechercher des mots partiels</li>
                  <li>• Les résultats sont limités à 50 employés</li>
                  <li>• La recherche se fait en temps réel</li>
                </ul>
              </div>
            </div>
          </ComponentCard>
        )}
      </div>
    </div>
  );
}
