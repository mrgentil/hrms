'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Liste des permissions système
export const PERMISSIONS = {
    // Utilisateurs
    USERS_VIEW: 'users.view',
    USERS_CREATE: 'users.create',
    USERS_EDIT: 'users.edit',
    USERS_DELETE: 'users.delete',

    // Départements
    DEPARTMENTS_VIEW: 'departments.view',
    DEPARTMENTS_CREATE: 'departments.create',
    DEPARTMENTS_EDIT: 'departments.edit',
    DEPARTMENTS_DELETE: 'departments.delete',

    // Postes
    POSITIONS_VIEW: 'positions.view',
    POSITIONS_CREATE: 'positions.create',
    POSITIONS_EDIT: 'positions.edit',
    POSITIONS_DELETE: 'positions.delete',

    // Rôles
    ROLES_VIEW: 'roles.view',
    ROLES_MANAGE: 'roles.manage',

    // Congés
    LEAVES_VIEW: 'leaves.view',
    LEAVES_MANAGE: 'leaves.manage',
    LEAVES_APPROVE: 'leaves.approve',

    // Rapports
    REPORTS_VIEW: 'reports.view',

    // Projets
    PROJECTS_VIEW: 'projects.view',
    PROJECTS_CREATE: 'projects.create',
    PROJECTS_MANAGE: 'projects.manage',

    // Administration
    SYSTEM_ADMIN: 'system.admin',
    SETTINGS_MANAGE: 'settings.manage',

    // ==========================================
    // NOUVEAUX MODULES HRMS
    // ==========================================

    // Formation & Développement
    TRAINING_VIEW: 'training.view',
    TRAINING_CREATE: 'training.create',
    TRAINING_MANAGE: 'training.manage',
    TRAINING_REGISTER: 'training.register',
    TRAINING_CERTIFICATIONS: 'training.certifications',

    // Recrutement
    RECRUITMENT_VIEW: 'recruitment.view',
    RECRUITMENT_CREATE: 'recruitment.create',
    RECRUITMENT_MANAGE: 'recruitment.manage',
    RECRUITMENT_INTERVIEWS: 'recruitment.interviews',
    RECRUITMENT_ONBOARDING: 'recruitment.onboarding',

    // Paie & Rémunération
    PAYROLL_VIEW: 'payroll.view',
    PAYROLL_VIEW_OWN: 'payroll.view_own',
    PAYROLL_MANAGE: 'payroll.manage',
    PAYROLL_ADVANCES: 'payroll.advances',
    PAYROLL_BONUSES: 'payroll.bonuses',
    PAYROLL_FUND_REQUESTS: 'payroll.fund_requests',

    // Performance & Évaluations
    PERFORMANCE_VIEW: 'performance.view',
    PERFORMANCE_VIEW_OWN: 'performance.view_own',
    PERFORMANCE_MANAGE: 'performance.manage',
    PERFORMANCE_REVIEWS: 'performance.reviews',
    PERFORMANCE_RECOGNITION: 'performance.recognition',

    // Conformité & Documents
    COMPLIANCE_VIEW: 'compliance.view',
    COMPLIANCE_MANAGE: 'compliance.manage',
    COMPLIANCE_CONTRACTS: 'compliance.contracts',
    COMPLIANCE_GDPR: 'compliance.gdpr',
    COMPLIANCE_MEDICAL: 'compliance.medical',

    // Assets & Équipements
    ASSETS_VIEW: 'assets.view',
    ASSETS_VIEW_OWN: 'assets.view_own',
    ASSETS_MANAGE: 'assets.manage',
    ASSETS_REQUEST: 'assets.request',

    // Planification & Ressources
    PLANNING_VIEW: 'planning.view',
    PLANNING_MANAGE: 'planning.manage',
    PLANNING_ROOMS: 'planning.rooms',
    PLANNING_REMOTE_WORK: 'planning.remote_work',

    // Bien-être & Engagement
    WELLBEING_VIEW: 'wellbeing.view',
    WELLBEING_MANAGE: 'wellbeing.manage',
    WELLBEING_SURVEYS: 'wellbeing.surveys',
    WELLBEING_EVENTS: 'wellbeing.events',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

interface PermissionsContextType {
    permissions: string[];
    hasPermission: (permission: string | string[]) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    hasAllPermissions: (permissions: string[]) => boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const usePermissions = () => {
    const context = useContext(PermissionsContext);
    if (context === undefined) {
        throw new Error('usePermissions must be used within a PermissionsProvider');
    }
    return context;
};

interface PermissionsProviderProps {
    children: ReactNode;
}

export const PermissionsProvider: React.FC<PermissionsProviderProps> = ({ children }) => {
    const { user } = useAuth();

    const permissions = useMemo(() => user?.permissions || [], [user]);

    const isSuperAdmin = useMemo(() =>
        user?.role === 'ROLE_SUPER_ADMIN',
        [user]
    );

    const isAdmin = useMemo(() =>
        user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_SUPER_ADMIN',
        [user]
    );

    const hasPermission = useMemo(() => (permission: string | string[]): boolean => {
        // Super admin a toutes les permissions
        if (isSuperAdmin) return true;

        if (Array.isArray(permission)) {
            return permission.some(p => permissions.includes(p));
        }

        return permissions.includes(permission);
    }, [permissions, isSuperAdmin]);

    const hasAnyPermission = useMemo(() => (requiredPermissions: string[]): boolean => {
        if (isSuperAdmin) return true;
        return requiredPermissions.some(p => permissions.includes(p));
    }, [permissions, isSuperAdmin]);

    const hasAllPermissions = useMemo(() => (requiredPermissions: string[]): boolean => {
        if (isSuperAdmin) return true;
        return requiredPermissions.every(p => permissions.includes(p));
    }, [permissions, isSuperAdmin]);

    const value: PermissionsContextType = {
        permissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isAdmin,
        isSuperAdmin,
    };

    return (
        <PermissionsContext.Provider value={value}>
            {children}
        </PermissionsContext.Provider>
    );
};

// Composant pour afficher conditionnellement les éléments UI basés sur les permissions
interface CanProps {
    permission: string | string[];
    children: ReactNode;
    fallback?: ReactNode;
}

export const Can: React.FC<CanProps> = ({ permission, children, fallback = null }) => {
    const { hasPermission } = usePermissions();

    if (hasPermission(permission)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};

// Composant inverse - cache si l'utilisateur A la permission
interface CannotProps {
    permission: string | string[];
    children: ReactNode;
}

export const Cannot: React.FC<CannotProps> = ({ permission, children }) => {
    const { hasPermission } = usePermissions();

    if (!hasPermission(permission)) {
        return <>{children}</>;
    }

    return null;
};

// Hook pour vérifier une permission dans un composant
export const useCanAccess = (permission: string | string[]): boolean => {
    const { hasPermission } = usePermissions();
    return hasPermission(permission);
};
