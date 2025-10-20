'use client';

import { useEffect, useMemo, useState } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import { employeesService, Document as EmployeeDocument } from '@/services/employees.service';
import { useToast } from '@/hooks/useToast';

type DocumentFilterState = {
  search: string;
  type: string;
  showConfidentialOnly: boolean;
  showExpired: 'all' | 'active' | 'expired';
};

const DEFAULT_FILTERS: DocumentFilterState = {
  search: '',
  type: 'all',
  showConfidentialOnly: false,
  showExpired: 'all',
};

const formatDate = (date: string | undefined | null) => {
  if (!date) {
    return 'Date non renseignée';
  }
  return new Date(date).toLocaleDateString('fr-FR');
};

const isExpiringSoon = (date?: string | null) => {
  if (!date) return false;
  const expiresAt = new Date(date).getTime();
  if (Number.isNaN(expiresAt)) return false;
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return expiresAt >= now && expiresAt - now <= thirtyDays;
};

const isExpired = (date?: string | null) => {
  if (!date) return false;
  const expiresAt = new Date(date).getTime();
  if (Number.isNaN(expiresAt)) return false;
  return expiresAt < Date.now();
};

export default function EmployeeDocumentsPage() {
  const toast = useToast();
  const [filters, setFilters] = useState<DocumentFilterState>(DEFAULT_FILTERS);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const response = await employeesService.getMyDocuments();
        if (!response?.success) {
          throw new Error(response?.message || 'Impossible de récupérer les documents.');
        }
        setDocuments(response.data || []);
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Erreur lors de la récupération des documents.';
        toast.error(message);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [toast]);

  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    documents.forEach((doc) => {
      if (doc.document_type) {
        types.add(doc.document_type);
      }
    });
    return Array.from(types).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const searchValue = filters.search.trim().toLowerCase();

    return documents.filter((doc) => {
      if (filters.showConfidentialOnly && !doc.is_confidential) {
        return false;
      }

      if (filters.type !== 'all' && (doc.document_type || 'Autre') !== filters.type) {
        return false;
      }

      if (filters.showExpired === 'active' && isExpired(doc.expires_at)) {
        return false;
      }

      if (filters.showExpired === 'expired' && !isExpired(doc.expires_at)) {
        return false;
      }

      if (searchValue.length > 0) {
        const haystack = [
          doc.name,
          doc.document_type,
          doc.description,
          doc.user_user_document_uploaded_by_user_idTouser?.full_name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!haystack.includes(searchValue)) {
          return false;
        }
      }

      return true;
    });
  }, [documents, filters]);

  const stats = useMemo(() => {
    const total = documents.length;
    const confidential = documents.filter((doc) => doc.is_confidential).length;
    const expiringSoon = documents.filter((doc) => isExpiringSoon(doc.expires_at)).length;
    const expired = documents.filter((doc) => isExpired(doc.expires_at)).length;

    return {
      total,
      confidential,
      expiringSoon,
      expired,
    };
  }, [documents]);

  const handleFilterChange = (partial: Partial<DocumentFilterState>) => {
    setFilters((previous) => ({ ...previous, ...partial }));
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Mes documents" />

      <div className="space-y-6">
        <ComponentCard title="Résumé">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border border-transparent bg-primary/10 px-4 py-3 text-primary">
              <div className="text-sm">Documents totaux</div>
              <div className="text-2xl font-semibold">{stats.total}</div>
            </div>
            <div className="rounded-lg border border-transparent bg-warning/10 px-4 py-3 text-warning">
              <div className="text-sm">Confidentiels</div>
              <div className="text-2xl font-semibold">{stats.confidential}</div>
            </div>
            <div className="rounded-lg border border-transparent bg-success/10 px-4 py-3 text-success">
              <div className="text-sm">Expire bientôt</div>
              <div className="text-2xl font-semibold">{stats.expiringSoon}</div>
            </div>
            <div className="rounded-lg border border-transparent bg-danger/10 px-4 py-3 text-danger">
              <div className="text-sm">Expirés</div>
              <div className="text-2xl font-semibold">{stats.expired}</div>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Filtres">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Rechercher
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(event) => handleFilterChange({ search: event.target.value })}
                placeholder="Nom, type, description..."
                className="w-full rounded border border-stroke px-3 py-2 text-sm outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Type de document
              </label>
              <select
                value={filters.type}
                onChange={(event) =>
                  handleFilterChange({ type: event.target.value || 'all' })
                }
                className="w-full rounded border border-stroke px-3 py-2 text-sm outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              >
                <option value="all">Tous les types</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Expiration
              </label>
              <select
                value={filters.showExpired}
                onChange={(event) =>
                  handleFilterChange({
                    showExpired: (event.target.value as DocumentFilterState['showExpired']) || 'all',
                  })
                }
                className="w-full rounded border border-stroke px-3 py-2 text-sm outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              >
                <option value="all">Toutes</option>
                <option value="active">Actives uniquement</option>
                <option value="expired">Expirées uniquement</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-5 md:pt-8">
              <input
                id="confidential-only"
                type="checkbox"
                checked={filters.showConfidentialOnly}
                onChange={(event) => handleFilterChange({ showConfidentialOnly: event.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label
                htmlFor="confidential-only"
                className="text-sm font-medium text-gray-600 dark:text-gray-400"
              >
                Confidentiels uniquement
              </label>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title={`Documents (${filteredDocuments.length})`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-primary"></div>
                <p className="text-gray-600 dark:text-gray-400">Chargement des documents...</p>
              </div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="py-12 text-center text-gray-600 dark:text-gray-400">
              <div className="mx-auto mb-4 text-5xl">📂</div>
              <p>Aucun document ne correspond aux filtres sélectionnés.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((document) => (
                <div
                  key={document.id}
                  className="rounded-lg border border-stroke bg-white p-4 transition-shadow hover:shadow-md dark:border-strokedark dark:bg-boxdark"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-black dark:text-white">
                        {document.name}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-primary">
                          {document.document_type || 'Document'}
                        </span>
                        {document.is_confidential && (
                          <span className="inline-flex items-center rounded-full bg-warning/10 px-2 py-1 text-warning">
                            Confidentiel
                          </span>
                        )}
                        {isExpiringSoon(document.expires_at) && !isExpired(document.expires_at) && (
                          <span className="inline-flex items-center rounded-full bg-danger/10 px-2 py-1 text-danger">
                            Expire bientôt
                          </span>
                        )}
                        {isExpired(document.expires_at) && (
                          <span className="inline-flex items-center rounded-full bg-gray-200 px-2 py-1 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            Expiré
                          </span>
                        )}
                      </div>
                      {document.description && (
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                          {document.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-start gap-2 text-sm text-gray-500 dark:text-gray-400 md:items-end">
                      <div>
                        Ajouté le{' '}
                        <span className="font-medium text-black dark:text-white">
                          {formatDate(document.created_at)}
                        </span>
                      </div>
                      <div>
                        Par{' '}
                        <span className="font-medium text-black dark:text-white">
                          {document.user_user_document_uploaded_by_user_idTouser?.full_name ||
                            'Système'}
                        </span>
                      </div>
                      <div>
                        Expiration :{' '}
                        <span className="font-medium text-black dark:text-white">
                          {document.expires_at ? formatDate(document.expires_at) : 'Aucune'}
                        </span>
                      </div>
                      <a
                        href={document.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-md border border-primary px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                      >
                        Ouvrir le document
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ComponentCard>
      </div>
    </div>
  );
}
