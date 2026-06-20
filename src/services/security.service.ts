import { apiClient } from '@/lib/api';

// ─────────────────────────────────────────────────────────────
// 2FA Service
// ─────────────────────────────────────────────────────────────

export interface TwoFAStatus {
    enabled: boolean;
    hasBackupCodes: boolean;
    backupCodesCount: number;
}

export interface TwoFASetupData {
    qrCodeDataUrl: string;
    manualKey: string;
}

export const twoFactorService = {
    /** Get current 2FA status for the authenticated user */
    getStatus: async (): Promise<TwoFAStatus> => {
        const res = await apiClient.get('/auth/2fa/status');
        return res.data;
    },

    /** Initiate 2FA setup — returns QR code and manual key */
    setup: async (): Promise<{ success: boolean; data: TwoFASetupData }> => {
        const res = await apiClient.post('/auth/2fa/setup');
        return res.data;
    },

    /** Verify TOTP code and activate 2FA */
    verifySetup: async (totpCode: string): Promise<{ success: boolean; data: { enabled: boolean; backupCodes: string[] } }> => {
        const res = await apiClient.post('/auth/2fa/verify-setup', { totp_code: totpCode });
        return res.data;
    },

    /** Disable 2FA (requires current TOTP code) */
    disable: async (totpCode: string): Promise<{ success: boolean; message: string }> => {
        const res = await apiClient.delete('/auth/2fa/disable', { data: { totp_code: totpCode } });
        return res.data;
    },

    /** Step 2 of login — verify TOTP code with temp token */
    login2FA: async (tempToken: string, totpCode: string): Promise<any> => {
        const res = await apiClient.post('/auth/2fa/login', {
            temp_token: tempToken,
            totp_code: totpCode,
        });
        return res.data;
    },
};

// ─────────────────────────────────────────────────────────────
// Export Service (Excel + PDF)  
// ─────────────────────────────────────────────────────────────

export const exportService = {
    /** Download employees Excel file */
    downloadEmployeesExcel: async (filters?: { department_id?: number; active?: boolean }) => {
        const params = new URLSearchParams();
        if (filters?.department_id) params.append('department_id', String(filters.department_id));
        if (filters?.active !== undefined) params.append('active', String(filters.active));

        const res = await apiClient.get(`/analytics/export/employees?${params}`, {
            responseType: 'blob',
        });
        const url = URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `employes_${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
    },

    /** Download payroll Excel for a specific month/year */
    downloadPayrollExcel: async (month: number, year: number) => {
        const res = await apiClient.get(`/analytics/export/payroll?month=${month}&year=${year}`, {
            responseType: 'blob',
        });
        const url = URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `paie_${month}_${year}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
    },

    /** Download attendance Excel for a specific month/year */
    downloadAttendanceExcel: async (month: number, year: number) => {
        const res = await apiClient.get(`/analytics/export/attendance?month=${month}&year=${year}`, {
            responseType: 'blob',
        });
        const url = URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `presences_${month}_${year}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
    },

    /** Download leaves Excel for a specific year */
    downloadLeavesExcel: async (year: number) => {
        const res = await apiClient.get(`/analytics/export/leaves?year=${year}`, {
            responseType: 'blob',
        });
        const url = URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `conges_${year}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
    },

    /** Download payslip PDF */
    downloadPayslipPDF: async (payslipId: number, employeeName?: string) => {
        const res = await apiClient.get(`/payroll/payslips/${payslipId}/pdf`, {
            responseType: 'blob',
        });
        const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `bulletin_paie_${payslipId}${employeeName ? `_${employeeName.replace(/\s+/g, '_')}` : ''}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    },
};
