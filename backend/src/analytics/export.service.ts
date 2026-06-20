import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExportService {
    private readonly logger = new Logger(ExportService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ─── Helpers ────────────────────────────────────────────────

    private styleHeaderRow(ws: ExcelJS.Worksheet, rowNum: number) {
        const row = ws.getRow(rowNum);
        row.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                bottom: { style: 'thin', color: { argb: 'FF2563EB' } },
            };
        });
        row.height = 22;
    }

    private styleDataRows(ws: ExcelJS.Worksheet, startRow: number) {
        ws.eachRow((row, rowNumber) => {
            if (rowNumber < startRow) return;
            const isEven = rowNumber % 2 === 0;
            row.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: isEven ? 'FFF1F5F9' : 'FFFFFFFF' },
                };
                cell.alignment = { vertical: 'middle' };
                cell.border = {
                    bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
                };
            });
            row.height = 18;
        });
    }

    private addSheetTitle(ws: ExcelJS.Worksheet, title: string, colCount: number) {
        ws.mergeCells(1, 1, 1, colCount);
        const titleCell = ws.getCell('A1');
        titleCell.value = title;
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
        titleCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        ws.getRow(1).height = 30;

        ws.mergeCells(2, 1, 2, colCount);
        const subtitleCell = ws.getCell('A2');
        subtitleCell.value = `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`;
        subtitleCell.font = { italic: true, color: { argb: 'FF64748B' }, size: 9 };
        subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        ws.getRow(2).height = 16;
    }

    // ─── Export Employees ────────────────────────────────────────

    async exportEmployeesExcel(filters?: { department_id?: number; active?: boolean }): Promise<Buffer> {
        const where: any = {};
        if (filters?.department_id) where.department_id = filters.department_id;
        if (filters?.active !== undefined) where.active = filters.active;

        const employees = await this.prisma.user.findMany({
            where,
            include: {
                department: { select: { name: true } },
                position: { select: { title: true, level: true } },
                role_relation: { select: { name: true } },
                user_financial_info: {
                    select: { employment_type: true, salary_basic: true, salary_net: true },
                },
            },
            orderBy: [{ department_id: 'asc' }, { full_name: 'asc' }],
        });

        const wb = new ExcelJS.Workbook();
        wb.creator = 'HRMS';
        wb.created = new Date();

        const ws = wb.addWorksheet('Employés', {
            pageSetup: { orientation: 'landscape', fitToPage: true },
        });

        const cols = [
            { header: 'ID', key: 'id', width: 8 },
            { header: 'Nom complet', key: 'full_name', width: 28 },
            { header: 'Email pro', key: 'work_email', width: 30 },
            { header: 'Département', key: 'department', width: 22 },
            { header: 'Poste', key: 'position', width: 22 },
            { header: 'Niveau', key: 'level', width: 12 },
            { header: 'Rôle', key: 'role', width: 18 },
            { header: 'Type contrat', key: 'employment_type', width: 16 },
            { header: 'Salaire brut', key: 'salary_basic', width: 16 },
            { header: 'Salaire net', key: 'salary_net', width: 16 },
            { header: "Date d'embauche", key: 'hire_date', width: 18 },
            { header: 'Statut', key: 'active', width: 10 },
        ];

        this.addSheetTitle(ws, 'LISTE DES EMPLOYÉS', cols.length);

        ws.columns = cols;
        ws.getRow(3).values = cols.map(c => c.header);
        this.styleHeaderRow(ws, 3);

        employees.forEach((emp, i) => {
            const row = ws.addRow({
                id: emp.id,
                full_name: emp.full_name,
                work_email: emp.work_email || '',
                department: emp.department?.name || '',
                position: emp.position?.title || '',
                level: emp.position?.level || '',
                role: emp.role_relation?.name || emp.role,
                employment_type: emp.user_financial_info?.[0]?.employment_type || '',
                salary_basic: Number(emp.user_financial_info?.[0]?.salary_basic || 0),
                salary_net: Number(emp.user_financial_info?.[0]?.salary_net || 0),
                hire_date: emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('fr-FR') : '',
                active: emp.active ? 'Actif' : 'Inactif',
            });

            // Color money columns
            ['salary_basic', 'salary_net'].forEach(col => {
                const cell = row.getCell(col);
                cell.numFmt = '#,##0.00';
                cell.font = { color: { argb: 'FF16A34A' } };
            });

            // Color status
            const statusCell = row.getCell('active');
            statusCell.font = { color: { argb: emp.active ? 'FF16A34A' : 'FFDC2626' }, bold: true };
        });

        this.styleDataRows(ws, 4);

        // Auto-filter
        ws.autoFilter = { from: 'A3', to: `${String.fromCharCode(64 + cols.length)}3` };

        const buffer = await wb.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    // ─── Export Payroll ──────────────────────────────────────────

    async exportPayrollExcel(month: number, year: number): Promise<Buffer> {
        const MONTHS_FR = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

        const payslips = await this.prisma.payslip.findMany({
            where: { month, year },
            include: {
                user: {
                    include: {
                        department: { select: { name: true } },
                        position: { select: { title: true } },
                    },
                },
            },
            orderBy: [{ user: { department_id: 'asc' } }, { user: { full_name: 'asc' } }],
        });

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet(`Paie ${MONTHS_FR[month]} ${year}`, {
            pageSetup: { orientation: 'landscape', fitToPage: true },
        });

        const cols = [
            { header: 'Employé', key: 'employee', width: 28 },
            { header: 'Département', key: 'department', width: 22 },
            { header: 'Poste', key: 'position', width: 20 },
            { header: 'Salaire Base', key: 'salary_basic', width: 16 },
            { header: 'Primes', key: 'allowances', width: 14 },
            { header: 'Brut', key: 'gross', width: 14 },
            { header: 'Bonuses', key: 'bonuses', width: 12 },
            { header: 'Retenues', key: 'deductions', width: 14 },
            { header: 'Avances', key: 'advances', width: 12 },
            { header: 'NET', key: 'net', width: 16 },
            { header: 'Statut', key: 'status', width: 12 },
        ];

        this.addSheetTitle(ws, `BULLETIN DE PAIE — ${MONTHS_FR[month].toUpperCase()} ${year}`, cols.length);

        ws.columns = cols;
        ws.getRow(3).values = cols.map(c => c.header);
        this.styleHeaderRow(ws, 3);

        let totalBasic = 0, totalGross = 0, totalDeductions = 0, totalNet = 0;

        payslips.forEach((ps) => {
            const row = ws.addRow({
                employee: ps.user.full_name,
                department: ps.user.department?.name || '',
                position: ps.user.position?.title || '',
                salary_basic: Number(ps.salary_basic),
                allowances: Number(ps.allowances_total),
                gross: Number(ps.salary_gross),
                bonuses: Number(ps.bonuses_total || 0),
                deductions: Number(ps.deductions_total),
                advances: Number(ps.advances_deducted || 0),
                net: Number(ps.salary_net),
                status: ps.status,
            });

            totalBasic += Number(ps.salary_basic);
            totalGross += Number(ps.salary_gross);
            totalDeductions += Number(ps.deductions_total);
            totalNet += Number(ps.salary_net);

            // Format money cells
            ['salary_basic', 'allowances', 'gross', 'bonuses', 'deductions', 'advances', 'net'].forEach(col => {
                row.getCell(col).numFmt = '#,##0.00';
            });
            row.getCell('net').font = { bold: true, color: { argb: 'FF1E3A5F' } };

            // Status color
            const statusCell = row.getCell('status');
            if (ps.status === 'PUBLISHED') {
                statusCell.font = { color: { argb: 'FF16A34A' }, bold: true };
            } else {
                statusCell.font = { color: { argb: 'FFCA8A04' } };
            }
        });

        this.styleDataRows(ws, 4);

        // Totals row
        const totalsRow = ws.addRow({
            employee: 'TOTAL',
            salary_basic: totalBasic,
            gross: totalGross,
            deductions: totalDeductions,
            net: totalNet,
        });
        totalsRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        });
        ['salary_basic', 'gross', 'deductions', 'net'].forEach(col => {
            totalsRow.getCell(col).numFmt = '#,##0.00';
        });
        totalsRow.height = 24;

        ws.autoFilter = { from: 'A3', to: `${String.fromCharCode(64 + cols.length)}3` };

        const buffer = await wb.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    // ─── Export Attendance ───────────────────────────────────────

    async exportAttendanceExcel(month: number, year: number): Promise<Buffer> {
        const MONTHS_FR = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const attendances = await this.prisma.attendance.findMany({
            where: { date: { gte: startDate, lte: endDate } },
            include: {
                user: {
                    select: {
                        full_name: true,
                        work_email: true,
                        department: { select: { name: true } },
                    },
                },
            },
            orderBy: [{ user: { full_name: 'asc' } }, { date: 'asc' }],
        });

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet(`Présences ${MONTHS_FR[month]} ${year}`);

        const cols = [
            { header: 'Employé', key: 'employee', width: 28 },
            { header: 'Département', key: 'department', width: 22 },
            { header: 'Date', key: 'date', width: 14 },
            { header: 'Arrivée', key: 'check_in', width: 12 },
            { header: 'Départ', key: 'check_out', width: 12 },
            { header: 'Heures travaillées', key: 'worked_hours', width: 18 },
            { header: 'Heures sup.', key: 'overtime_hours', width: 14 },
            { header: 'Statut', key: 'status', width: 14 },
            { header: 'Notes', key: 'notes', width: 25 },
        ];

        this.addSheetTitle(ws, `PRÉSENCES — ${MONTHS_FR[month].toUpperCase()} ${year}`, cols.length);

        ws.columns = cols;
        ws.getRow(3).values = cols.map(c => c.header);
        this.styleHeaderRow(ws, 3);

        const STATUS_COLORS: Record<string, string> = {
            PRESENT: 'FF16A34A',
            LATE: 'FFCA8A04',
            ABSENT: 'FFDC2626',
            LEAVE: 'FF2563EB',
            HOLIDAY: 'FF7C3AED',
            HALF_DAY: 'FF0891B2',
        };

        attendances.forEach((att) => {
            const row = ws.addRow({
                employee: att.user.full_name,
                department: att.user.department?.name || '',
                date: new Date(att.date).toLocaleDateString('fr-FR'),
                check_in: att.check_in ? new Date(att.check_in).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '',
                check_out: att.check_out ? new Date(att.check_out).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '',
                worked_hours: att.worked_hours ? `${att.worked_hours.toFixed(1)}h` : '',
                overtime_hours: att.overtime_hours ? `${att.overtime_hours.toFixed(1)}h` : '',
                status: att.status,
                notes: att.notes || '',
            });

            const statusCell = row.getCell('status');
            const color = STATUS_COLORS[att.status] || 'FF64748B';
            statusCell.font = { color: { argb: color }, bold: true };
        });

        this.styleDataRows(ws, 4);
        ws.autoFilter = { from: 'A3', to: `${String.fromCharCode(64 + cols.length)}3` };

        const buffer = await wb.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    // ─── Export Leaves ───────────────────────────────────────────

    async exportLeavesExcel(year: number): Promise<Buffer> {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);

        const leaves = await this.prisma.application.findMany({
            where: {
                type: 'Leave' as any,
                start_date: { gte: startDate, lte: endDate },
            },
            include: {
                user: {
                    select: {
                        full_name: true,
                        department: { select: { name: true } },
                    },
                },
                leave_type: { select: { name: true } },
            },
            orderBy: [{ start_date: 'asc' }],
        });

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet(`Congés ${year}`);

        const cols = [
            { header: 'Employé', key: 'employee', width: 28 },
            { header: 'Département', key: 'department', width: 22 },
            { header: 'Type congé', key: 'leave_type', width: 18 },
            { header: 'Début', key: 'start_date', width: 14 },
            { header: 'Fin', key: 'end_date', width: 14 },
            { header: 'Raison', key: 'reason', width: 30 },
            { header: 'Statut', key: 'status', width: 14 },
        ];

        this.addSheetTitle(ws, `RAPPORT DES CONGÉS ${year}`, cols.length);

        ws.columns = cols;
        ws.getRow(3).values = cols.map(c => c.header);
        this.styleHeaderRow(ws, 3);

        leaves.forEach((leave) => {
            const row = ws.addRow({
                employee: leave.user?.full_name || '',
                department: leave.user?.department?.name || '',
                leave_type: leave.leave_type?.name || '',
                start_date: new Date(leave.start_date).toLocaleDateString('fr-FR'),
                end_date: new Date(leave.end_date).toLocaleDateString('fr-FR'),
                reason: leave.reason || '',
                status: leave.status,
            });

            const statusCell = row.getCell('status');
            const statusColors: Record<string, string> = {
                Approved: 'FF16A34A',
                Pending: 'FFCA8A04',
                Rejected: 'FFDC2626',
            };
            statusCell.font = { color: { argb: statusColors[leave.status] || 'FF64748B' }, bold: true };
        });

        this.styleDataRows(ws, 4);
        ws.autoFilter = { from: 'A3', to: `${String.fromCharCode(64 + cols.length)}3` };

        const buffer = await wb.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
}
