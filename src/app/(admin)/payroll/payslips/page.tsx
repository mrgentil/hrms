"use client";

import React, { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { payslipService } from "@/services/payroll.service";
import { employeesService } from "@/services/employees.service";
import { useToast } from "@/hooks/useToast";
import { useUserRole, hasPermission } from "@/hooks/useUserRole";
import type { Payslip, PayslipStatus, CreatePayslipDto } from "@/types/payroll.types";
import type { Employee } from "@/services/employees.service";
import { Command } from "cmdk";
import { CheckIcon, ChevronsUpDownIcon, SearchIcon, Download, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function PayslipsPage() {
    const toast = useToast();
    const { role: userRole } = useUserRole();

    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [loading, setLoading] = useState(true);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Employee Search State
    const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);
    const [employeeQuery, setEmployeeQuery] = useState("");
    const [foundEmployees, setFoundEmployees] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    // Filters
    const [filters, setFilters] = useState({
        year: new Date().getFullYear(),
        month: 0, // 0 = all months
        user_id: 0, // 0 = all users
    });

    // Form state
    const [formData, setFormData] = useState<CreatePayslipDto>({
        user_id: 0,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        notes: '',
    });

    // Permission checks
    const canViewAll = !!userRole && (hasPermission(userRole, 'payroll.view') || hasPermission(userRole, 'payroll.manage'));
    const canGenerate = !!userRole && hasPermission(userRole, 'payroll.manage');
    const canPublish = !!userRole && hasPermission(userRole, 'payroll.manage');

    useEffect(() => {
        loadPayslips();
    }, [filters]);

    // Debounced employee search
    // Debounced employee search or load default
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                // If query is empty, fetch default list (e.g. first 50)
                // If query is present, search
                let res;
                if (!employeeQuery) {
                    res = await employeesService.getEmployees({ limit: 50 });
                } else {
                    res = await employeesService.searchEmployees(employeeQuery);
                }
                const data = Array.isArray(res) ? res : res?.data || [];
                setFoundEmployees(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error("Search error", e);
            }
        };

        const timer = setTimeout(fetchEmployees, 300);
        return () => clearTimeout(timer);
    }, [employeeQuery]);

    const loadPayslips = async () => {
        try {
            setLoading(true);
            const params = {
                year: filters.year,
                ...(filters.month > 0 && { month: filters.month }),
                ...(filters.user_id > 0 && { user_id: filters.user_id }),
            };

            const response = canViewAll
                ? await payslipService.getPayslips(params)
                : await payslipService.getMyPayslips({ year: filters.year });

            setPayslips(canViewAll && 'data' in response ? response.data : response.data);
        } catch (error) {
            console.error('Erreur chargement bulletins:', error);
            toast.error('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedEmployee) {
            toast.error('Veuillez sélectionner un employé');
            return;
        }

        try {
            await payslipService.createPayslip({
                ...formData,
                user_id: selectedEmployee.id
            });
            toast.success('Bulletin de paie généré avec succès');
            setShowGenerateModal(false);
            resetForm();
            loadPayslips();
        } catch (error: any) {
            console.error('Erreur génération:', error);
            toast.error(error.response?.data?.message || 'Erreur lors de la génération du bulletin');
        }
    };

    const handleDownloadPDF = async (id: number, userName: string, month: number, year: number) => {
        try {
            const blob = await payslipService.downloadPDF(id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Bulletin_${userName}_${month}_${year}.pdf`); // Or .txt for now
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            toast.success('Téléchargement lancé');
        } catch (error) {
            console.error('Erreur téléchargement PDF:', error);
            toast.error('Erreur lors du téléchargement');
        }
    };

    const handlePublish = async (id: number) => {
        if (!confirm('Êtes-vous sûr de vouloir publier ce bulletin ? Il sera visible par l\'employé.')) {
            return;
        }

        try {
            await payslipService.publishPayslip(id);
            toast.success('Bulletin publié avec succès');
            loadPayslips();
        } catch (error) {
            console.error('Erreur publication:', error);
            toast.error('Erreur lors de la publication');
        }
    };

    const resetForm = () => {
        setFormData({
            user_id: 0,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            notes: '',
        });
        setSelectedEmployee(null);
        setEmployeeQuery("");
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            PUBLISHED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        };
        const labels = {
            DRAFT: 'Brouillon',
            PUBLISHED: 'Publié',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
                {labels[status as keyof typeof labels] || status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <PageBreadcrumb items={[{ label: 'Paie', href: '/payroll' }, { label: 'Bulletins', active: true }]} />
                {canGenerate && (
                    <button
                        onClick={() => setShowGenerateModal(true)}
                        className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2"
                    >
                        <span>+ Générer un bulletin</span>
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap gap-4">
                <select
                    value={filters.year}
                    onChange={(e) => setFilters({ ...filters, year: Number(e.target.value) })}
                    className="px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    {[2024, 2025, 2026].map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>

                <select
                    value={filters.month}
                    onChange={(e) => setFilters({ ...filters, month: Number(e.target.value) })}
                    className="px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    <option value={0}>Tous les mois</option>
                    {MONTHS.map((m, i) => (
                        <option key={i} value={i + 1}>{m}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                            <tr>
                                <th className="px-6 py-4 font-medium">Employé</th>
                                <th className="px-6 py-4 font-medium">Période</th>
                                <th className="px-6 py-4 font-medium text-right">Brut</th>
                                <th className="px-6 py-4 font-medium text-right">Net</th>
                                <th className="px-6 py-4 font-medium text-center">Statut</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Chargement...
                                    </td>
                                </tr>
                            ) : payslips.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Aucun bulletin trouvé pour cette période
                                    </td>
                                </tr>
                            ) : (
                                payslips.map((payslip) => (
                                    <tr key={payslip.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                                {payslip.user?.full_name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {payslip.user?.work_email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            {MONTHS[payslip.month - 1]} {payslip.year}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-600 dark:text-gray-400">
                                            {Number(payslip.salary_gross).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-gray-100">
                                            {Number(payslip.salary_net).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {getStatusBadge(payslip.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedPayslip(payslip);
                                                        setShowDetailsModal(true);
                                                    }}
                                                    className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                    title="Détails"
                                                >
                                                    <SearchIcon className="w-4 h-4" />
                                                </button>
                                                {canPublish && payslip.status === 'DRAFT' && (
                                                    <button
                                                        onClick={() => handlePublish(payslip.id)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Publier"
                                                    >
                                                        <Send className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDownloadPDF(payslip.id, payslip.user?.full_name || 'Bulletin', payslip.month, payslip.year)}
                                                    className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                    title="Télécharger PDF"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Generate Modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Générer un bulletin</h2>
                        </div>
                        <form onSubmit={handleGenerateSubmit} className="p-6 space-y-4">

                            {/* Employee Selection with Combobox */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Employé
                                </label>
                                <div className="relative">
                                    <div
                                        onClick={() => setEmployeeSearchOpen(true)}
                                        className="flex items-center justify-between w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <span className={selectedEmployee ? "text-gray-900 dark:text-white" : "text-gray-400"}>
                                            {selectedEmployee ? selectedEmployee.full_name : "Rechercher un employé..."}
                                        </span>
                                        <ChevronsUpDownIcon className="w-4 h-4 text-gray-500" />
                                    </div>

                                    {/* Combobox Dropdown */}
                                    {employeeSearchOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                            <Command className="w-full" shouldFilter={false}>
                                                <div className="flex items-center border-b border-gray-100 dark:border-gray-700 px-3">
                                                    <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                                    <Command.Input
                                                        placeholder="Rechercher par nom..."
                                                        value={employeeQuery}
                                                        onValueChange={setEmployeeQuery}
                                                        className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white"
                                                        autoFocus
                                                    />
                                                </div>
                                                <Command.List className="max-h-[200px] overflow-y-auto p-2">
                                                    <Command.Empty className="py-6 text-center text-sm text-gray-500">
                                                        {employeeQuery ? "Aucun employé trouvé." : "Chargement..."}
                                                    </Command.Empty>

                                                    {foundEmployees.length > 0 && (
                                                        <Command.Group heading="Employés" className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                                            {foundEmployees.map((employee) => (
                                                                <Command.Item
                                                                    key={employee.id}
                                                                    onSelect={() => {
                                                                        setSelectedEmployee(employee);
                                                                        setEmployeeSearchOpen(false);
                                                                    }}
                                                                    className={cn(
                                                                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/20 dark:hover:text-brand-400 aria-selected:bg-brand-50 aria-selected:text-brand-600",
                                                                        selectedEmployee?.id === employee.id && "bg-brand-50 text-brand-600 dark:bg-brand-900/20"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center gap-2 w-full">
                                                                        {employee.profile_photo_url ? (
                                                                            <img src={employee.profile_photo_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                                                                        ) : (
                                                                            <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-600">
                                                                                {employee.full_name.charAt(0)}
                                                                            </div>
                                                                        )}
                                                                        <div className="flex flex-col">
                                                                            <span className="font-medium">{employee.full_name}</span>
                                                                            <span className="text-xs text-gray-400">{employee.work_email}</span>
                                                                        </div>
                                                                    </div>
                                                                    {selectedEmployee?.id === employee.id && (
                                                                        <CheckIcon className="ml-auto h-4 w-4" />
                                                                    )}
                                                                </Command.Item>
                                                            ))}
                                                        </Command.Group>
                                                    )}
                                                </Command.List>
                                            </Command>
                                            <div
                                                className="fixed inset-0 z-[-1]"
                                                onClick={() => setEmployeeSearchOpen(false)}
                                            ></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Mois
                                    </label>
                                    <select
                                        value={formData.month}
                                        onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    >
                                        {MONTHS.map((m, i) => (
                                            <option key={i} value={i + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Année
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Notes (optionnel)
                                </label>
                                <textarea
                                    value={formData.notes || ''}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowGenerateModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
                                >
                                    Générer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedPayslip && (
                <PayslipDetailsModal
                    payslip={selectedPayslip}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedPayslip(null);
                    }}
                />
            )}
        </div>
    );
}

// Payslip Details Modal
function PayslipDetailsModal({ payslip, onClose }: { payslip: Payslip; onClose: () => void }) {
    const formatCurrency = (amount: number | string | undefined | null) => {
        if (!amount && amount !== 0) return '-';
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
        }).format(typeof amount === 'string' ? parseFloat(amount) : Number(amount));
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Bulletin de paie - {MONTHS[payslip.month - 1]} {payslip.year}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">{payslip.user?.full_name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Salary Breakdown */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Salaire</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">Salaire de base</span>
                                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(payslip.salary_basic)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">Salaire brut</span>
                                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(payslip.salary_gross)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Allowances */}
                    {payslip.allowances_total > 0 && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-100 dark:border-green-900/30">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Allocations</h4>
                            <div className="space-y-2">
                                {payslip.allowances_breakdown && Array.isArray(payslip.allowances_breakdown) &&
                                    payslip.allowances_breakdown.map((item: any, index: number) => (
                                        <div key={index} className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                                            <span className="text-green-600 dark:text-green-400">+{formatCurrency(item.amount)}</span>
                                        </div>
                                    ))
                                }
                                <div className="flex justify-between pt-2 border-t border-green-200 dark:border-green-800">
                                    <span className="font-medium text-gray-900 dark:text-white">Total</span>
                                    <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(payslip.allowances_total)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Deductions */}
                    {payslip.deductions_total > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-100 dark:border-red-900/30">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Déductions</h4>
                            <div className="space-y-2">
                                {payslip.deductions_breakdown && Array.isArray(payslip.deductions_breakdown) &&
                                    payslip.deductions_breakdown.map((item: any, index: number) => (
                                        <div key={index} className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                                            <span className="text-red-600 dark:text-red-400">-{formatCurrency(item.amount)}</span>
                                        </div>
                                    ))
                                }
                                <div className="flex justify-between pt-2 border-t border-red-200 dark:border-red-800">
                                    <span className="font-medium text-gray-900 dark:text-white">Total</span>
                                    <span className="font-bold text-red-600 dark:text-red-400">-{formatCurrency(payslip.deductions_total)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bonuses */}
                    {payslip.bonuses_total && payslip.bonuses_total > 0 && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-900/30">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Primes</h4>
                            <div className="space-y-2">
                                {payslip.bonuses_breakdown && Array.isArray(payslip.bonuses_breakdown) &&
                                    payslip.bonuses_breakdown.map((item: any, index: number) => (
                                        <div key={index} className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                                            <span className="text-blue-600 dark:text-blue-400">+{formatCurrency(item.amount)}</span>
                                        </div>
                                    ))
                                }
                                <div className="flex justify-between pt-2 border-t border-blue-200 dark:border-blue-800">
                                    <span className="font-medium text-gray-900 dark:text-white">Total</span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(payslip.bonuses_total)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Net Salary */}
                    <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-6 flex flex-col items-center justify-center border border-gray-200 dark:border-gray-600">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Salaire Net à Payer</span>
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(payslip.salary_net)}</span>
                    </div>

                    {payslip.notes && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-100 dark:border-yellow-900/30">
                            <h4 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-2">Notes</h4>
                            <p className="text-yellow-700 dark:text-yellow-300 text-sm">{payslip.notes}</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}
