'use client';

import { useEffect, useState } from 'react';
import { employeesService } from '@/services/employees.service';
import { useToast } from '@/hooks/useToast';

interface OrganizationEmployee {
  id: number;
  full_name: string;
  position: string;
  level?: string;
  manager?: {
    id: number;
    full_name: string;
  };
  subordinates?: {
    id: number;
    full_name: string;
    position?: { title: string };
  }[];
  profile_photo_url?: string;
  work_email?: string;
}

interface OrganizationDepartment {
  id: number;
  name: string;
  employees: OrganizationEmployee[];
  managers: OrganizationEmployee[];
  subordinates: OrganizationEmployee[];
}

export default function Organigramme() {
  const [departments, setDepartments] = useState<OrganizationDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const toast = useToast();

  useEffect(() => {
    const fetchOrganizationChart = async () => {
      try {
        setLoading(true);
        const response = await employeesService.getOrganizationChart();
        if (response.success) {
          setDepartments(response.data);
        } else {
          toast.error(response.message || 'Erreur lors de la récupération de l\'organigramme');
        }
      } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Erreur lors de la récupération de l\'organigramme';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationChart();
  }, [toast]);

  const filteredDepartments = departments.filter(dept => {
    if (selectedDepartment && dept.id !== selectedDepartment) return false;
    
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      dept.name.toLowerCase().includes(searchLower) ||
      dept.employees.some(emp => 
        emp.full_name.toLowerCase().includes(searchLower) ||
        emp.position.toLowerCase().includes(searchLower) ||
        emp.work_email?.toLowerCase().includes(searchLower)
      )
    );
  });

  const EmployeeCard = ({ employee }: { employee: OrganizationEmployee }) => (
    <div className="bg-white dark:bg-boxdark rounded-lg shadow-md p-4 border border-stroke dark:border-strokedark hover:shadow-lg transition-shadow">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
            {employee.profile_photo_url ? (
              <img
                src={employee.profile_photo_url}
                alt={employee.full_name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              employee.full_name.charAt(0).toUpperCase()
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-black dark:text-white truncate">
            {employee.full_name}
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
            {employee.position}
          </p>
          {employee.work_email && (
            <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
              {employee.work_email}
            </p>
          )}
        </div>
      </div>
      
      {employee.manager && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Manager: <span className="font-medium">{employee.manager.full_name}</span>
          </p>
        </div>
      )}
      
      {employee.subordinates && employee.subordinates.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Équipe ({employee.subordinates.length}):
          </p>
          <div className="space-y-1">
            {employee.subordinates.slice(0, 3).map((subordinate) => (
              <div key={subordinate.id} className="text-xs text-gray-700 dark:text-gray-300">
                • {subordinate.full_name}
                {subordinate.position?.title && (
                  <span className="text-gray-500 dark:text-gray-500"> - {subordinate.position.title}</span>
                )}
              </div>
            ))}
            {employee.subordinates.length > 3 && (
              <div className="text-xs text-gray-500 dark:text-gray-500">
                +{employee.subordinates.length - 3} autres...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement de l'organigramme...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres et recherche */}
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-md p-6 border border-stroke dark:border-strokedark">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher un employé, poste ou département..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded border border-stroke px-4 py-2 text-sm outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
            />
          </div>
          <div className="md:w-64">
            <select
              value={selectedDepartment || ''}
              onChange={(e) => setSelectedDepartment(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded border border-stroke px-4 py-2 text-sm outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
            >
              <option value="">Tous les départements</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.employees.length})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-md p-4 border border-stroke dark:border-strokedark">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {departments.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Départements</div>
          </div>
        </div>
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-md p-4 border border-stroke dark:border-strokedark">
          <div className="text-center">
            <div className="text-2xl font-bold text-success mb-1">
              {departments.reduce((acc, dept) => acc + dept.employees.length, 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Employés actifs</div>
          </div>
        </div>
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-md p-4 border border-stroke dark:border-strokedark">
          <div className="text-center">
            <div className="text-2xl font-bold text-warning mb-1">
              {departments.reduce((acc, dept) => 
                acc + dept.employees.filter(emp => emp.manager).length, 0
              )}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avec manager</div>
          </div>
        </div>
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-md p-4 border border-stroke dark:border-strokedark">
          <div className="text-center">
            <div className="text-2xl font-bold text-meta-5 mb-1">
              {departments.reduce((acc, dept) => 
                acc + dept.employees.filter(emp => emp.subordinates && emp.subordinates.length > 0).length, 0
              )}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Managers</div>
          </div>
        </div>
      </div>

      {/* Organigramme par département */}
      {filteredDepartments.length === 0 ? (
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-md p-8 border border-stroke dark:border-strokedark text-center">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <p className="text-gray-600 dark:text-gray-400">
            Aucun résultat trouvé pour "{searchTerm}"
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredDepartments.map((department) => (
            <div
              key={department.id}
              className="bg-white dark:bg-boxdark rounded-lg shadow-md border border-stroke dark:border-strokedark overflow-hidden"
            >
              {/* En-tête du département */}
              <div className="bg-primary/5 dark:bg-primary/10 px-6 py-4 border-b border-stroke dark:border-strokedark">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-black dark:text-white">
                    {department.name}
                  </h3>
                  <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    {department.employees.length} employé{department.employees.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Employés du département */}
              <div className="p-6">
                {department.employees.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    Aucun employé dans ce département
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {department.employees
                      .filter(emp => {
                        if (!searchTerm) return true;
                        const searchLower = searchTerm.toLowerCase();
                        return (
                          emp.full_name.toLowerCase().includes(searchLower) ||
                          emp.position.toLowerCase().includes(searchLower) ||
                          emp.work_email?.toLowerCase().includes(searchLower)
                        );
                      })
                      .map((employee) => (
                        <EmployeeCard key={employee.id} employee={employee} />
                      ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
