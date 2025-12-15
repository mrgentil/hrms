"use client";

import React, { useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { payslipService } from "@/services/payroll.service";
import { useToast } from "@/hooks/useToast";
import { Calculator, ArrowRight, DollarSign, Building, User, PieChart } from "lucide-react";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SalarySimulatorPage() {
    const toast = useToast();
    const [grossSalary, setGrossSalary] = useState<number>(3000); // Default value
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleSimulate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await payslipService.simulateSalary(Number(grossSalary));
            // Backend returns object directly or wrapped in success?
            // Controller returns: await this.payslipsService.simulateSalary(grossSalary);
            // Service returns: object.
            // Axios returns: { data: object }
            // So response is the object directly if we unwrapped properly in service.
            // Let's assume response.data or response is correct based on service implementation.
            // Service implementation: return response.data;
            setResult(response);
            toast.success("Simulation réussie !");
        } catch (error) {
            console.error("Simulation error", error);
            toast.error("Erreur lors de la simulation");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    const chartData = result ? {
        labels: ['Salaire Net', 'Déductions (IPR/CNSS)', 'Charges Patronales'],
        datasets: [
            {
                data: [result.net_salary, result.employee_deductions, result.employer_charges],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)', // Green (Net)
                    'rgba(245, 158, 11, 0.8)', // Amber (Deductions)
                    'rgba(59, 130, 246, 0.8)', // Blue (Employer)
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(59, 130, 246, 1)',
                ],
                borderWidth: 1,
            },
        ],
    } : null;

    return (
        <div className="space-y-6">
            <PageBreadcrumb items={[{ label: 'Paie', href: '/payroll' }, { label: 'Simulateur', active: true }]} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                            <Calculator className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Calculatrice Salaire</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Estimez le coût total et le salaire net (USD).</p>
                        </div>
                    </div>

                    <form onSubmit={handleSimulate} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Salaire Brut Mensuel ($)
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="number"
                                    value={grossSalary}
                                    onChange={(e) => setGrossSalary(Number(e.target.value))}
                                    className="w-full pl-10 pr-4 py-3 text-lg border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                    required
                                    min="0"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="animate-spin text-xl">⏳</span>
                            ) : (
                                <>
                                    Simuler maintenant <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">💡 Note d'information</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
                            Ce simulateur utilise des taux estimatifs (CNSS, IPR). Pour le calcul exact selon la législation RDC, veuillez consulter les barèmes officiels.
                        </p>
                    </div>
                </div>

                {/* Results Section */}
                {result ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        {/* Highlights Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border border-green-100 dark:border-green-800">
                                <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Net à Payer (Avant IR)</p>
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(result.net_salary)}
                                </h3>
                                <p className="text-xs text-green-700 dark:text-green-500 mt-2 flex items-center gap-1">
                                    <User className="w-3 h-3" /> Pour l'employé
                                </p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800">
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Coût Total Employeur</p>
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(result.employer_cost)}
                                </h3>
                                <p className="text-xs text-blue-700 dark:text-blue-500 mt-2 flex items-center gap-1">
                                    <Building className="w-3 h-3" /> Pour l'entreprise
                                </p>
                            </div>
                        </div>

                        {/* Detailed Breakdown */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-gray-500" /> Répartition
                            </h3>

                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                {/* Chart */}
                                <div className="w-48 h-48 flex-shrink-0">
                                    {chartData && <Doughnut data={chartData} options={{ maintainAspectRatio: true, plugins: { legend: { display: false } } }} />}
                                </div>

                                {/* List */}
                                <div className="flex-1 w-full space-y-3">
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                            <span className="text-sm text-gray-600 dark:text-gray-300">Salaire Brut</span>
                                        </div>
                                        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(result.gross_salary)}</span>
                                    </div>

                                    <div className="flex justify-between items-center p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                            <span className="text-sm text-gray-600 dark:text-gray-300">Charges Salariales (-22%)</span>
                                        </div>
                                        <span className="font-semibold text-red-600 dark:text-red-400">-{formatCurrency(result.employee_deductions)}</span>
                                    </div>

                                    <div className="flex justify-between items-center p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                                            <span className="text-sm text-gray-600 dark:text-gray-300">Charges Patronales</span>
                                        </div>
                                        <span className="font-semibold text-gray-900 dark:text-white">+{formatCurrency(result.employer_charges)}</span>
                                    </div>

                                    <div className="border-t border-gray-200 dark:border-gray-600 pt-3 flex justify-between items-center">
                                        <span className="font-bold text-gray-900 dark:text-white">Net Mensuel</span>
                                        <span className="font-bold text-green-600 dark:text-green-400 text-lg">{formatCurrency(result.monthly_net)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="hidden lg:flex items-center justify-center p-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                        <div>
                            <div className="text-6xl mb-4">🔮</div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">En attente de simulation</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Entrez un montant brut pour voir la magie opérer.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
