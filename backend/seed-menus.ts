import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMenus() {
  console.log('=== Seed Menus & Permissions ===\n');
  const now = new Date();

  // 1. D'abord, mettre à jour les permissions existantes avec les groupes
  const permissionUpdates = [
    { name: 'users.view', group_name: 'Utilisateurs', group_icon: '👤', label: 'Voir les utilisateurs' },
    { name: 'users.create', group_name: 'Utilisateurs', group_icon: '👤', label: 'Créer des utilisateurs' },
    { name: 'users.edit', group_name: 'Utilisateurs', group_icon: '👤', label: 'Modifier des utilisateurs' },
    { name: 'users.delete', group_name: 'Utilisateurs', group_icon: '👤', label: 'Supprimer des utilisateurs' },
    { name: 'users.view_salary', group_name: 'Utilisateurs', group_icon: '👤', label: 'Voir les salaires' },
    { name: 'roles.view', group_name: 'Rôles', group_icon: '🔐', label: 'Voir les rôles' },
    { name: 'roles.manage', group_name: 'Rôles', group_icon: '🔐', label: 'Gérer les rôles' },
    { name: 'departments.view', group_name: 'Organisation', group_icon: '🏢', label: 'Voir les départements' },
    { name: 'departments.manage', group_name: 'Organisation', group_icon: '🏢', label: 'Gérer les départements' },
    { name: 'positions.view', group_name: 'Organisation', group_icon: '🏢', label: 'Voir les postes' },
    { name: 'positions.manage', group_name: 'Organisation', group_icon: '🏢', label: 'Gérer les postes' },
    { name: 'leaves.view', group_name: 'Congés', group_icon: '🏖️', label: 'Voir ses congés' },
    { name: 'leaves.view_all', group_name: 'Congés', group_icon: '🏖️', label: 'Voir tous les congés' },
    { name: 'leaves.approve', group_name: 'Congés', group_icon: '🏖️', label: 'Approuver les congés' },
    { name: 'leaves.manage', group_name: 'Congés', group_icon: '🏖️', label: 'Gérer les congés' },
    { name: 'announcements.view', group_name: 'Annonces', group_icon: '📢', label: 'Voir les annonces' },
    { name: 'announcements.manage', group_name: 'Annonces', group_icon: '📢', label: 'Gérer les annonces' },
    { name: 'projects.view', group_name: 'Projets', group_icon: '📂', label: 'Voir ses projets' },
    { name: 'projects.view_all', group_name: 'Projets', group_icon: '📂', label: 'Voir tous les projets' },
    { name: 'projects.manage', group_name: 'Projets', group_icon: '📂', label: 'Gérer les projets' },
    { name: 'tasks.view', group_name: 'Tâches', group_icon: '✅', label: 'Voir ses tâches' },
    { name: 'tasks.view_all', group_name: 'Tâches', group_icon: '✅', label: 'Voir toutes les tâches' },
    { name: 'tasks.manage', group_name: 'Tâches', group_icon: '✅', label: 'Gérer les tâches' },
    { name: 'reports.view', group_name: 'Rapports', group_icon: '📊', label: 'Voir les rapports' },
    { name: 'expenses.view', group_name: 'Dépenses', group_icon: '💰', label: 'Voir les dépenses' },
    { name: 'expenses.approve', group_name: 'Dépenses', group_icon: '💰', label: 'Approuver les dépenses' },
    { name: 'system.admin', group_name: 'Système', group_icon: '⚙️', label: 'Administration système' },
  ];

  console.log('Mise à jour des permissions...');
  for (const perm of permissionUpdates) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {
        group_name: perm.group_name,
        group_icon: perm.group_icon,
        label: perm.label,
        updated_at: now,
      },
      create: {
        name: perm.name,
        group_name: perm.group_name,
        group_icon: perm.group_icon,
        label: perm.label,
        description: perm.label,
        created_at: now,
        updated_at: now,
      },
    });
  }
  console.log(`✅ ${permissionUpdates.length} permissions mises à jour\n`);

  // 2. Récupérer les IDs des permissions
  const allPerms = await prisma.permission.findMany();
  const permMap = new Map(allPerms.map(p => [p.name, p.id]));

  // 3. Créer les menus
  console.log('Création des menus...');

  // Supprimer les menus existants pour éviter les doublons
  await prisma.menu_item.deleteMany({});

  const menus = [
    // Menu Principal
    { name: 'Dashboard', path: '/', icon: '📊', section: 'main', sort_order: 1, permission: 'reports.view' },
    { name: 'Pointage', path: '/attendance', icon: '⏰', section: 'main', sort_order: 2, permission: null },
    { name: 'Notes de Frais', path: '/expenses', icon: '💰', section: 'main', sort_order: 3, permission: 'expenses.view' },
    
    // Gestion d'équipe
    { name: 'Gestion d\'équipe', path: null, icon: '👥', section: 'main', sort_order: 4, permission: 'departments.view', children: [
      { name: 'Annuaire des employés', path: '/employees', icon: '📋', permission: 'users.view' },
      { name: 'Organigramme', path: '/employees/organigramme', icon: '🏢', permission: 'departments.view' },
      { name: 'Recherche collaborateurs', path: '/employees/search', icon: '🔍', permission: 'users.view' },
      { name: 'Annonces d\'équipe', path: '/employees/announcements', icon: '📢', permission: 'announcements.view' },
    ]},
    
    // Gestion Utilisateurs
    { name: 'Gestion Utilisateurs', path: null, icon: '👤', section: 'main', sort_order: 5, permission: 'users.view', children: [
      { name: 'Liste Utilisateurs', path: '/users', icon: '📋', permission: 'users.view' },
      { name: 'Rôles & Permissions', path: '/users/roles', icon: '🔐', permission: 'roles.manage' },
      { name: 'Permissions', path: '/users/permissions', icon: '🔑', permission: 'roles.manage' },
      { name: 'Configuration Menus', path: '/users/menus', icon: '📑', permission: 'roles.manage' },
    ]},
    
    // Organisation
    { name: 'Organisation', path: null, icon: '🏢', section: 'main', sort_order: 6, permission: 'departments.view', children: [
      { name: 'Départements', path: '/departments', icon: '🏛️', permission: 'departments.view' },
      { name: 'Postes', path: '/positions', icon: '💼', permission: 'positions.view' },
      { name: 'Contrats', path: '/contracts', icon: '📝', permission: 'users.view' },
      { name: 'Annonces', path: '/announcements', icon: '📢', permission: 'announcements.manage' },
    ]},
    
    // Congés
    { name: 'Congés & Absences', path: null, icon: '🏖️', section: 'main', sort_order: 7, permission: 'leaves.view', children: [
      { name: 'Mes Congés', path: '/leaves/my-leaves', icon: '📅', permission: 'leaves.view' },
      { name: 'Tous les Congés', path: '/leaves/all', icon: '📋', permission: 'leaves.view_all' },
      { name: 'Validation des Congés', path: '/leaves/review', icon: '✅', permission: 'leaves.approve' },
      { name: 'Types de Congés', path: '/leaves/types', icon: '📑', permission: 'leaves.manage' },
    ]},
    
    // Projets & Tâches
    { name: 'Projets & Tâches', path: null, icon: '📂', section: 'main', sort_order: 8, permission: 'projects.view', children: [
      { name: 'Mes Projets', path: '/employees/projects', icon: '📁', permission: 'projects.view' },
      { name: 'Mes Tâches', path: '/my-tasks', icon: '✅', permission: 'tasks.view' },
      { name: 'Tous les Projets', path: '/projects', icon: '📊', permission: 'projects.view_all' },
      { name: 'Toutes les Tâches', path: '/tasks', icon: '📋', permission: 'tasks.view_all' },
    ]},
    
    // Rapports
    { name: 'Rapports & Analytics', path: null, icon: '📊', section: 'advanced', sort_order: 1, permission: 'reports.view', children: [
      { name: 'Tableau de Bord RH', path: '/reports/hr', icon: '📈', permission: 'reports.view' },
      { name: 'Statistiques Congés', path: '/reports/leave', icon: '📉', permission: 'reports.view' },
    ]},
    
    // Administration
    { name: 'Administration', path: null, icon: '⚙️', section: 'advanced', sort_order: 2, permission: 'system.admin', children: [
      { name: 'Paramètres', path: '/settings', icon: '🔧', permission: 'system.admin' },
      { name: 'Logs & Audit', path: '/admin/logs', icon: '📜', permission: 'system.admin' },
    ]},
  ];

  let menuCount = 0;
  for (const menu of menus) {
    const parentMenu = await prisma.menu_item.create({
      data: {
        name: menu.name,
        path: menu.path,
        icon: menu.icon,
        section: menu.section,
        sort_order: menu.sort_order,
        permission_id: menu.permission ? permMap.get(menu.permission) : null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    });
    menuCount++;

    if (menu.children) {
      let childOrder = 1;
      for (const child of menu.children) {
        await prisma.menu_item.create({
          data: {
            name: child.name,
            path: child.path,
            icon: child.icon,
            parent_id: parentMenu.id,
            section: menu.section,
            sort_order: childOrder++,
            permission_id: child.permission ? permMap.get(child.permission) : null,
            is_active: true,
            created_at: now,
            updated_at: now,
          },
        });
        menuCount++;
      }
    }
  }

  console.log(`✅ ${menuCount} menus créés\n`);
  console.log('=== Seed terminé avec succès ===');
}

seedMenus()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
