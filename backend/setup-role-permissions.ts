import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Nouvelles permissions à créer
const NEW_PERMISSIONS = [
  // Notes de frais
  { name: 'expenses.view_own', label: 'Voir ses notes de frais', group_name: 'Dépenses', group_icon: '💰' },
  { name: 'expenses.create', label: 'Soumettre une note de frais', group_name: 'Dépenses', group_icon: '💰' },
  { name: 'expenses.view_team', label: 'Voir les notes de son équipe', group_name: 'Dépenses', group_icon: '💰' },
  { name: 'expenses.view_all', label: 'Voir toutes les notes de frais', group_name: 'Dépenses', group_icon: '💰' },
  { name: 'expenses.manage', label: 'Gérer les notes de frais', group_name: 'Dépenses', group_icon: '💰' },
  { name: 'expenses.stats', label: 'Voir les statistiques dépenses', group_name: 'Dépenses', group_icon: '💰' },

  // Pointage
  { name: 'attendance.view_own', label: 'Voir son pointage', group_name: 'Pointage', group_icon: '⏰' },
  { name: 'attendance.clock', label: 'Pointer (entrée/sortie)', group_name: 'Pointage', group_icon: '⏰' },
  { name: 'attendance.view_team', label: 'Voir le pointage de son équipe', group_name: 'Pointage', group_icon: '⏰' },
  { name: 'attendance.view_all', label: 'Voir tous les pointages', group_name: 'Pointage', group_icon: '⏰' },
  { name: 'attendance.correct', label: 'Corriger les pointages', group_name: 'Pointage', group_icon: '⏰' },
  { name: 'attendance.stats', label: 'Voir les statistiques pointage', group_name: 'Pointage', group_icon: '⏰' },

  // Budget / Demandes de fonds
  { name: 'budget.request', label: 'Faire une demande de budget', group_name: 'Budget', group_icon: '💵' },
  { name: 'budget.view_own', label: 'Voir ses demandes de budget', group_name: 'Budget', group_icon: '💵' },
  { name: 'budget.view_team', label: 'Voir les demandes de son équipe', group_name: 'Budget', group_icon: '💵' },
  { name: 'budget.view_all', label: 'Voir toutes les demandes', group_name: 'Budget', group_icon: '💵' },
  { name: 'budget.recommend', label: 'Recommander une demande', group_name: 'Budget', group_icon: '💵' },
  { name: 'budget.approve', label: 'Approuver les demandes de budget', group_name: 'Budget', group_icon: '💵' },
  { name: 'budget.stats', label: 'Voir les statistiques budget', group_name: 'Budget', group_icon: '💵' },

  // Planning
  { name: 'planning.rooms', label: 'Réserver des salles', group_name: 'Planification', group_icon: '📅' },

  // Congés vue équipe
  { name: 'leaves.view_team', label: 'Voir les congés de l\'équipe', group_name: 'Congés', group_icon: '🏖️' },
];

// Permissions par rôle
const ROLE_PERMISSIONS: Record<string, string[]> = {
  'Super Admin': ['*'], // Toutes les permissions

  'Admin': [
    // Système
    'system.admin', 'system.logs', 'system.backup', 'system.settings',
    'settings.view', 'settings.manage',
    // Utilisateurs
    'users.view', 'users.create', 'users.edit', 'users.delete', 'users.manage_roles',
    // Rôles
    'roles.view', 'roles.manage',
    // Rapports
    'reports.view', 'reports.create',
    // Pointage (gestion)
    'attendance.view_own', 'attendance.clock', 'attendance.view_all', 'attendance.manage', 'attendance.stats',
    // Notes de frais (stats)
    'expenses.view_own', 'expenses.create', 'expenses.manage', 'expenses.stats',
    // Budget (stats)
    'budget.view_own', 'budget.request', 'budget.stats',
    // Organisation
    'departments.view', 'departments.manage', 'positions.view', 'positions.manage',
  ],

  'RH': [
    // Utilisateurs
    'users.view', 'users.create', 'users.edit', 'users.view_salary', 'users.edit_salary',
    // Organisation
    'departments.view', 'departments.manage', 'departments.create', 'departments.edit', 'departments.delete',
    'positions.view', 'positions.manage', 'positions.create', 'positions.edit', 'positions.delete',
    // Congés
    'leaves.view', 'leaves.view_own', 'leaves.view_all', 'leaves.approve', 'leaves.manage', 'leaves.manage_types', 'leaves.create', 'leaves.reject',
    // Annonces
    'announcements.view', 'announcements.manage',
    // Recrutement
    'recruitment.view', 'recruitment.manage', 'recruitment.create', 'recruitment.interviews', 'recruitment.onboarding',
    // Formation
    'training.view', 'training.manage', 'training.create', 'training.certifications', 'training.register',
    // Performance
    'performance.view', 'performance.view_own', 'performance.manage', 'performance.reviews', 'performance.recognition',
    // Paie
    'payroll.view', 'payroll.view_own', 'payroll.manage', 'payroll.bonuses', 'payroll.advances', 'payroll.fund_requests',
    // Conformité
    'compliance.view', 'compliance.manage', 'compliance.contracts', 'compliance.medical', 'compliance.gdpr',
    // Rapports
    'reports.view',
    // Pointage
    'attendance.view_own', 'attendance.clock', 'attendance.view_all', 'attendance.manage', 'attendance.correct', 'attendance.stats',
    // Notes de frais
    'expenses.view_own', 'expenses.create', 'expenses.view_all', 'expenses.approve', 'expenses.manage', 'expenses.stats',
    // Budget
    'budget.view_own', 'budget.request', 'budget.view_all', 'budget.approve', 'budget.manage',
    // Bien-être
    'wellbeing.view', 'wellbeing.manage', 'wellbeing.events', 'wellbeing.surveys',
    // Profil
    'profile.view_own', 'profile.edit_own',
  ],

  'Manager': [
    // Équipe
    'users.view', 'departments.view', 'positions.view',
    // Congés
    'leaves.view', 'leaves.view_own', 'leaves.view_team', 'leaves.approve', 'leaves.create', 'leaves.cancel',
    // Projets
    'projects.view', 'projects.view_all', 'projects.manage', 'projects.create', 'projects.edit',
    // Tâches
    'tasks.view', 'tasks.view_all', 'tasks.manage', 'tasks.create', 'tasks.edit',
    // Annonces
    'announcements.view',
    // Performance
    'performance.view', 'performance.view_own', 'performance.reviews', 'performance.recognition',
    // Rapports
    'reports.view',
    // Pointage
    'attendance.view_own', 'attendance.clock', 'attendance.view_team', 'attendance.correct',
    // Notes de frais
    'expenses.view_own', 'expenses.create', 'expenses.view_team', 'expenses.approve',
    // Budget
    'budget.view_own', 'budget.request', 'budget.view_team', 'budget.recommend', 'budget.approve',
    // Planning
    'planning.view', 'planning.manage', 'planning.remote_work',
    // Présences
    'attendance.view', 'attendance.manage',
    // Profil
    'profile.view_own', 'profile.edit_own',
    // Formation
    'training.view', 'training.register',
  ],

  'Directeur Finance': [
    // Paie
    'payroll.view', 'payroll.view_own', 'payroll.manage', 'payroll.bonuses', 'payroll.advances', 'payroll.fund_requests',
    // Notes de frais
    'expenses.view_own', 'expenses.create', 'expenses.view_all', 'expenses.approve', 'expenses.manage', 'expenses.stats',
    // Budget
    'budget.view_own', 'budget.request', 'budget.view_all', 'budget.approve', 'budget.manage', 'budget.stats',
    // Rapports
    'reports.view', 'reports.create',
    // Utilisateurs (lecture salaires)
    'users.view', 'users.view_salary',
    // Pointage
    'attendance.view_own', 'attendance.clock',
    // Congés
    'leaves.view', 'leaves.view_own', 'leaves.create', 'leaves.cancel',
    // Profil
    'profile.view_own', 'profile.edit_own',
    // Annonces
    'announcements.view',
  ],

  'Employee': [
    // Profil
    'profile.view_own', 'profile.edit_own',
    // Congés
    'leaves.view', 'leaves.view_own', 'leaves.create', 'leaves.cancel',
    // Projets & Tâches
    'projects.view', 'tasks.view', 'tasks.create', 'tasks.edit',
    // Annonces
    'announcements.view',
    // Performance
    'performance.view_own', 'performance.recognition',
    // Formation
    'training.view', 'training.register',
    // Paie
    'payroll.view_own',
    // Équipements
    'assets.view_own', 'assets.request',
    // Planning
    'planning.view', 'planning.remote_work',
    // Bien-être
    'wellbeing.view',
    // Pointage
    'attendance.view_own', 'attendance.clock',
    // Notes de frais
    'expenses.view_own', 'expenses.create',
    // Budget
    'budget.view_own', 'budget.request',
  ],

  'Employé': [
    'profile.view_own', 'profile.edit_own',
    'departments.view', 'positions.view',
    'leaves.view_own', 'leaves.view_team', 'leaves.create', 'leaves.cancel',
    'projects.view',
    'tasks.view', 'tasks.create', 'tasks.edit',
    'announcements.view',
    'performance.view_own', 'performance.recognition',
    'training.view', 'training.register',
    'payroll.view_own',
    'assets.view_own', 'assets.request',
    'planning.view', 'planning.remote_work', 'planning.rooms',
    'wellbeing.view',
    'attendance.view_own', 'attendance.clock', 'attendance.correct',
    'expenses.view_own', 'expenses.create',
    'budget.view_own', 'budget.request',
  ],
};

async function main() {
  const now = new Date();

  console.log('\n=== SETUP PERMISSIONS PAR RÔLE ===\n');

  // 1. Créer les nouvelles permissions
  console.log('📝 Création des nouvelles permissions...');
  for (const perm of NEW_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {
        label: perm.label,
        group_name: perm.group_name,
        group_icon: perm.group_icon,
        updated_at: now,
      },
      create: {
        name: perm.name,
        label: perm.label,
        description: perm.label,
        group_name: perm.group_name,
        group_icon: perm.group_icon,
        created_at: now,
        updated_at: now,
      },
    });
  }
  console.log(`   ✅ ${NEW_PERMISSIONS.length} permissions créées/mises à jour\n`);

  // 2. Récupérer toutes les permissions pour Super Admin
  const allPermissions = await prisma.permission.findMany();
  const allPermNames = allPermissions.map(p => p.name);

  // 3. Appliquer les permissions à chaque rôle
  console.log('🔐 Attribution des permissions aux rôles...\n');

  for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.findFirst({
      where: { name: roleName },
    });

    if (!role) {
      console.log(`   ⚠️  Rôle "${roleName}" non trouvé, ignoré`);
      continue;
    }

    // Si '*', prendre toutes les permissions
    const rolePerms = permissions.includes('*') ? allPermNames : permissions;

    await prisma.role.update({
      where: { id: role.id },
      data: {
        permissions: rolePerms,
        updated_at: now,
      },
    });

    console.log(`   ✅ ${role.icon || '👤'} ${roleName}: ${rolePerms.length} permissions`);
  }

  console.log('\n=== TERMINÉ ===\n');

  // Afficher un résumé
  const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } });
  console.log('📊 Résumé:\n');
  roles.forEach(r => {
    const count = Array.isArray(r.permissions) ? (r.permissions as string[]).length : 0;
    console.log(`   ${r.icon || '👤'} ${r.name}: ${count} permissions`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
