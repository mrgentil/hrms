/**
 * Constantes des permissions système HRMS
 * Ces permissions peuvent être assignées aux rôles personnalisés
 */
export const SYSTEM_PERMISSIONS = {
    // ==========================================
    // PERMISSIONS DE BASE
    // ==========================================

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

    // Annonces
    ANNOUNCEMENTS_VIEW: 'announcements.view',
    ANNOUNCEMENTS_MANAGE: 'announcements.manage',

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

export type SystemPermission = typeof SYSTEM_PERMISSIONS[keyof typeof SYSTEM_PERMISSIONS];

/**
 * Liste des permissions groupées par module pour l'affichage dans l'UI
 */
export const PERMISSION_GROUPS = [
    {
        name: 'Utilisateurs',
        icon: '👤',
        permissions: [
            { key: 'users.view', label: 'Voir les utilisateurs', description: 'Accéder à la liste des utilisateurs' },
            { key: 'users.create', label: 'Créer des utilisateurs', description: 'Ajouter de nouveaux utilisateurs' },
            { key: 'users.edit', label: 'Modifier les utilisateurs', description: 'Éditer les profils utilisateurs' },
            { key: 'users.delete', label: 'Supprimer des utilisateurs', description: 'Supprimer des utilisateurs' },
        ],
    },
    {
        name: 'Départements',
        icon: '🏢',
        permissions: [
            { key: 'departments.view', label: 'Voir les départements', description: 'Accéder à la liste des départements' },
            { key: 'departments.create', label: 'Créer des départements', description: 'Ajouter de nouveaux départements' },
            { key: 'departments.edit', label: 'Modifier les départements', description: 'Éditer les départements' },
            { key: 'departments.delete', label: 'Supprimer des départements', description: 'Supprimer des départements' },
        ],
    },
    {
        name: 'Postes',
        icon: '💼',
        permissions: [
            { key: 'positions.view', label: 'Voir les postes', description: 'Accéder à la liste des postes' },
            { key: 'positions.create', label: 'Créer des postes', description: 'Ajouter de nouveaux postes' },
            { key: 'positions.edit', label: 'Modifier les postes', description: 'Éditer les postes' },
            { key: 'positions.delete', label: 'Supprimer des postes', description: 'Supprimer des postes' },
        ],
    },
    {
        name: 'Rôles & Permissions',
        icon: '🔐',
        permissions: [
            { key: 'roles.view', label: 'Voir les rôles', description: 'Accéder à la liste des rôles' },
            { key: 'roles.manage', label: 'Gérer les rôles', description: 'Créer, modifier et supprimer des rôles' },
        ],
    },
    {
        name: 'Congés & Absences',
        icon: '🏖️',
        permissions: [
            { key: 'leaves.view', label: 'Voir les congés', description: 'Accéder à la liste des congés' },
            { key: 'leaves.manage', label: 'Gérer les congés', description: 'Créer et modifier les types de congés' },
            { key: 'leaves.approve', label: 'Approuver les congés', description: 'Valider ou refuser les demandes de congés' },
        ],
    },
    {
        name: 'Annonces',
        icon: '📢',
        permissions: [
            { key: 'announcements.view', label: 'Voir les annonces', description: 'Accéder aux annonces d\'équipe' },
            { key: 'announcements.manage', label: 'Gérer les annonces', description: 'Créer, modifier et publier des annonces d\'équipe' },
        ],
    },
    {
        name: 'Formation & Développement',
        icon: '📚',
        permissions: [
            { key: 'training.view', label: 'Voir les formations', description: 'Accéder au catalogue de formations' },
            { key: 'training.create', label: 'Créer des formations', description: 'Ajouter de nouvelles formations' },
            { key: 'training.manage', label: 'Gérer les formations', description: 'Administrer les formations et inscriptions' },
            { key: 'training.register', label: 'S\'inscrire aux formations', description: 'Demander des inscriptions' },
            { key: 'training.certifications', label: 'Gérer les certifications', description: 'Administrer les certifications' },
        ],
    },
    {
        name: 'Recrutement',
        icon: '👥',
        permissions: [
            { key: 'recruitment.view', label: 'Voir le recrutement', description: 'Accéder aux offres et candidatures' },
            { key: 'recruitment.create', label: 'Créer des offres', description: 'Publier de nouvelles offres d\'emploi' },
            { key: 'recruitment.manage', label: 'Gérer le recrutement', description: 'Administrer le processus de recrutement' },
            { key: 'recruitment.interviews', label: 'Gérer les entretiens', description: 'Planifier et évaluer les entretiens' },
            { key: 'recruitment.onboarding', label: 'Gérer l\'onboarding', description: 'Suivre l\'intégration des nouveaux' },
        ],
    },
    {
        name: 'Paie & Rémunération',
        icon: '💰',
        permissions: [
            { key: 'payroll.view', label: 'Voir la paie (tous)', description: 'Accéder à toutes les informations de paie' },
            { key: 'payroll.view_own', label: 'Voir sa paie', description: 'Consulter ses propres bulletins' },
            { key: 'payroll.manage', label: 'Gérer la paie', description: 'Administrer les bulletins de paie' },
            { key: 'payroll.advances', label: 'Gérer les avances', description: 'Traiter les demandes d\'avances' },
            { key: 'payroll.bonuses', label: 'Gérer les primes', description: 'Attribuer primes et bonus' },
            { key: 'payroll.fund_requests', label: 'Demandes de fonds', description: 'Gérer les demandes de fonds pour dépenses business' },
        ],
    },
    {
        name: 'Performance & Évaluations',
        icon: '📊',
        permissions: [
            { key: 'performance.view', label: 'Voir la performance (tous)', description: 'Accéder à toutes les évaluations' },
            { key: 'performance.view_own', label: 'Voir sa performance', description: 'Consulter ses propres objectifs' },
            { key: 'performance.manage', label: 'Gérer la performance', description: 'Administrer les campagnes d\'évaluation' },
            { key: 'performance.reviews', label: 'Évaluer les collaborateurs', description: 'Réaliser des évaluations' },
            { key: 'performance.recognition', label: 'Reconnaissance', description: 'Envoyer des kudos et récompenses' },
        ],
    },
    {
        name: 'Conformité & Documents',
        icon: '📋',
        permissions: [
            { key: 'compliance.view', label: 'Voir la conformité', description: 'Accéder aux dossiers et documents' },
            { key: 'compliance.manage', label: 'Gérer la conformité', description: 'Administrer les documents RH' },
            { key: 'compliance.contracts', label: 'Gérer les contrats', description: 'Créer et modifier les contrats' },
            { key: 'compliance.gdpr', label: 'Accès RGPD', description: 'Gérer les demandes RGPD' },
            { key: 'compliance.medical', label: 'Visites médicales', description: 'Planifier les visites médicales' },
        ],
    },
    {
        name: 'Assets & Équipements',
        icon: '💻',
        permissions: [
            { key: 'assets.view', label: 'Voir les assets (tous)', description: 'Accéder à tout l\'inventaire' },
            { key: 'assets.view_own', label: 'Voir ses assets', description: 'Consulter son matériel assigné' },
            { key: 'assets.manage', label: 'Gérer les assets', description: 'Administrer l\'inventaire' },
            { key: 'assets.request', label: 'Demander du matériel', description: 'Soumettre des demandes d\'équipement' },
        ],
    },
    {
        name: 'Planification & Ressources',
        icon: '📅',
        permissions: [
            { key: 'planning.view', label: 'Voir le planning', description: 'Accéder aux plannings d\'équipe' },
            { key: 'planning.manage', label: 'Gérer le planning', description: 'Administrer les plannings' },
            { key: 'planning.rooms', label: 'Réserver des salles', description: 'Gérer les réservations de salles' },
            { key: 'planning.remote_work', label: 'Télétravail', description: 'Déclarer ses jours de télétravail' },
        ],
    },
    {
        name: 'Bien-être & Engagement',
        icon: '💬',
        permissions: [
            { key: 'wellbeing.view', label: 'Voir le bien-être', description: 'Accéder aux ressources bien-être' },
            { key: 'wellbeing.manage', label: 'Gérer le bien-être', description: 'Administrer les programmes' },
            { key: 'wellbeing.surveys', label: 'Créer des sondages', description: 'Lancer des enquêtes satisfaction' },
            { key: 'wellbeing.events', label: 'Gérer les événements', description: 'Organiser des événements' },
        ],
    },
    {
        name: 'Administration',
        icon: '⚙️',
        permissions: [
            { key: 'system.admin', label: 'Administration système', description: 'Accès complet administration' },
            { key: 'settings.manage', label: 'Gérer les paramètres', description: 'Modifier les paramètres application' },
            { key: 'reports.view', label: 'Voir les rapports', description: 'Accéder aux rapports et analytics' },
        ],
    },
];

/**
 * Retourne toutes les permissions sous forme de tableau
 */
export function getAllPermissions(): string[] {
    return Object.values(SYSTEM_PERMISSIONS);
}

/**
 * Retourne les permissions groupées pour l'affichage
 */
export function getPermissionGroups() {
    return PERMISSION_GROUPS;
}
