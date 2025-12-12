"use client";

import React, { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { employeesService, Employee } from "@/services/employees.service";
import { departmentsService, Department } from "@/services/departments.service";
import { useToast } from "@/hooks/useToast";
import { useUserRole, hasPermission } from "@/hooks/useUserRole";
import Link from "next/link";

export default function SalariesPage() {
    const toast = useToast();
    const { role: userRole } = useUserRole();

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>();
    const [salaryFilter, setSalaryFilter] = useState<{ min?: number; max?: number }>({});
    const [sortField, setSortField] = useState<'name' | 'department' | 'salary_basic' | 'salary_gross' | 'salary_net'>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Permission checks
    const canViewSalary = !!userRole && hasPermission(userRole, 'users.view_salary');
    const canEditSalary = !!userRole && hasPermission(userRole, 'users.edit_salary');

    useEffect(() => {
        loadDepartments();
        loadEmployees();
    }, []);

    const loadDepartments = async () => {
        try {
            const depts = await departmentsService.getDepartments();
            setDepartments(depts);
        } catch (error) {
            console.error('Erreur chargement départements:', error);
        }
    };

    const loadEmployees = async () => {
        try {
            setLoading(true);
            const response = await employeesService.getEmployees({
                page: 1,
                limit: 1000, // Get all for salary view
                search: searchTerm || undefined,
                department_id: selectedDepartment,
            });

            if (response.success) {
                setEmployees(response.data);
            }
        } catch (error) {
            console.error('Erreur chargement employés:', error);
            toast.error('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadEmployees();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, selectedDepartment]);

    const formatCurrency = (amount?: number | null) => {
        if (!amount && amount !== 0) return '-';
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount);
    };

    const formatDate = (date?: string | Date | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('fr-FR');
    };

    const handleSort = (field: typeof sortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleExport = () => {
        // Simple CSV export
        const headers = ['Nom', 'Département', 'Poste', 'Salaire Base', 'Salaire Brut', 'Salaire Net', 'Allocations', 'Déductions'];
        const rows = filteredAndSortedEmployees.map(emp => {
            const financial = emp.user_financial_info?.[0];
            return [
                emp.full_name,
                emp.department_user_department_idTodepartment?.department_name || '',
                emp.position?.title || '',
                financial?.salary_basic || 0,
                financial?.salary_gross || 0,
                financial?.salary_net || 0,
                financial?.allowance_total || 0,
                financial?.deduction_total || 0,
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `salaires_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success('Export réussi');
    };

    // Filter and sort employees
    const filteredAndSortedEmployees = employees
        .filter(emp => {
            const financial = emp.user_financial_info?.[0];
            if (!financial) return false;

            // Salary range filter
            if (salaryFilter.min && financial.salary_net && financial.salary_net < salaryFilter.min) return false;
            if (salaryFilter.max && financial.salary_net && financial.salary_net > salaryFilter.max) return false;

            return true;
        })
        .sort((a, b) => {
            let aVal: any, bVal: any;

            switch (sortField) {
                case 'name':
                    aVal = a.full_name;
                    bVal = b.full_name;
                    break;
                case 'department':
                    aVal = a.department_user_department_idTodepartment?.department_name || '';
                    bVal = b.department_user_department_idTodepartment?.department_name || '';
                    break;
                case 'salary_basic':
                    aVal = a.user_financial_info?.[0]?.salary_basic || 0;
                    bVal = b.user_financial_info?.[0]?.salary_basic || 0;
                    break;
                case 'salary_gross':
                    aVal = a.user_financial_info?.[0]?.salary_gross || 0;
                    bVal = b.user_financial_info?.[0]?.salary_gross || 0;
                    break;
                case 'salary_net':
                    aVal = a.user_financial_info?.[0]?.salary_net || 0;
                    bVal = b.user_financial_info?.[0]?.salary_net || 0;
                    break;
            }

            if (typeof aVal === 'string') {
                return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        });

    // Calculate statistics
    const stats = {
        total: filteredAndSortedEmployees.length,
        totalPayroll: filteredAndSortedEmployees.reduce((sum, emp) =>
            sum + (emp.user_financial_info?.[0]?.salary_net || 0), 0),
        averageSalary: filteredAndSortedEmployees.length > 0
            ? filteredAndSortedEmployees.reduce((sum, emp) =>
                sum + (emp.user_financial_info?.[0]?.salary_net || 0), 0) / filteredAndSortedEmployees.length
            : 0,
    };

    if (!canViewSalary) {
        return (
            <div>
                <PageBreadcrumb pageTitle="Gestion des Salaires" />
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                    <div className="text-red-500 text-4xl mb-4">🔒</div>
                    <p className="text-gray-600 dark:text-gray-400">
                        Vous n'avez pas la permission de consulter les salaires.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageBreadcrumb pageTitle="Gestion des Salaires" />

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total employés</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Masse salariale totale</p>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">{formatCurrency(stats.totalPayroll)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Salaire moyen</p>
                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{formatCurrency(stats.averageSalary)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Recherche
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Nom, email..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Département
                        </label>
                        <select
                            value={selectedDepartment || ''}
                            onChange={(e) => setSelectedDepartment(e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">Tous</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.department_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Salaire min
                        </label>
                        <input
                            type="number"
                            value={salaryFilter.min || ''}
                            onChange={(e) => setSalaryFilter({ ...salaryFilter, min: e.target.value ? Number(e.target.value) : undefined })}
                            placeholder="0"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Salaire max
                        </label>
                        <input
                            type="number"
                            value={salaryFilter.max || ''}
                            onChange={(e) => setSalaryFilter({ ...salaryFilter, max: e.target.value ? Number(e.target.value) : undefined })}
                            placeholder="999999"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                </div>

                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleExport}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Exporter CSV
                    </button>
                </div>
            </div>

            {/* Salary Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-gray-500">Chargement...</p>
                    </div>
                ) : filteredAndSortedEmployees.length === 0 ? (
                    <div className="p-8 text-center">
                        <span className="text-4xl">💰</span>
                        <p className="mt-2 text-gray-500">Aucun employé trouvé</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th
                                        onClick={() => handleSort('name')}
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        Employé {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th
                                        onClick={() => handleSort('department')}
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        Département {sortField === 'department' && (sortDirection === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Poste
                                    </th>
                                    <th
                                        onClick={() => handleSort('salary_basic')}
                                        className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        Base  {sortField === 'salary_basic' && (sortDirection === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th
                                        onClick={() => handleSort('salary_gross')}
                                        className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        Brut {sortField === 'salary_gross' && (sortDirection === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th
                                        onClick={() => handleSort('salary_net')}
                                        className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        Net {sortField === 'salary_net' && (sortDirection === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Allocations
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Déductions
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredAndSortedEmployees.map((employee) => {
                                    const financial = employee.user_financial_info?.[0];

                                    return (
                                        <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                                        {employee.full_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <Link
                                                            href={`/users/${employee.id}`}
                                                            className="font-medium text-gray-900 dark:text-white hover:text-primary transition-colors"
                                                        >
                                                            {employee.full_name}
                                                        </Link>
                                                        <p className="text-sm text-gray-500">{employee.work_email || employee.username}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                {employee.department_user_department_idTodepartment?.department_name || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                {employee.position?.title || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-right text-gray-900 dark:text-white">
                                                {formatCurrency(financial?.salary_basic)}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-right text-gray-900 dark:text-white">
                                                {formatCurrency(financial?.salary_gross)}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-bold text-right text-green-600 dark:text-green-400">
                                                {formatCurrency(financial?.salary_net)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right text-blue-600 dark:text-blue-400">
                                                {formatCurrency(financial?.allowance_total)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right text-red-600 dark:text-red-400">
                                                {formatCurrency(financial?.deduction_total)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link
                                                    href={`/users/${employee.id}?tab=financial`}
                                                    className="text-primary hover:text-primary/80 text-sm font-medium"
                                                >
                                                    Détails
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
