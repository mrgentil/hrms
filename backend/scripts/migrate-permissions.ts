import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateToPermissions() {
  try {
    console.log('🚀 Début de la migration vers le système de permissions...\n');

    // 1. Créer les permissions de base
    console.log('📝 Création des permissions...');
    const permissions = [
      { name: 'users.view', description: 'Voir la liste des utilisateurs' },
      { name: 'users.create', description: 'Créer de nouveaux utilisateurs' },
      { name: 'users.edit', description: 'Modifier les utilisateurs existants' },
      { name: 'users.delete', description: 'Supprimer des utilisateurs' },
      { name: 'users.manage_roles', description: 'Gérer les rôles des utilisateurs' },
      { name: 'reports.view', description: 'Voir les rapports' },
      { name: 'reports.export', description: 'Exporter les rapports' },
      { name: 'departments.view', description: 'Voir les départements' },
      { name: 'departments.manage', description: 'Gérer les départements' },
      { name: 'projects.view', description: 'Voir les projets' },
      { name: 'projects.manage', description: 'Gérer les projets' },
      { name: 'system.admin', description: 'Administration système complète' },
    ];

    for (const perm of permissions) {
      await prisma.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: {
          name: perm.name,
          description: perm.description,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }
    console.log(`✅ ${permissions.length} permissions créées`);

    // 2. Créer les rôles
    console.log('🎭 Création des rôles...');
    const roles = [
      { name: 'Admin', description: 'Administrateur système avec tous les droits' },
      { name: 'Manager', description: 'Manager avec droits de gestion' },
      { name: 'Employee', description: 'Employé avec droits de base' },
    ];

    for (const role of roles) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: {
          name: role.name,
          description: role.description,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }
    console.log(`✅ ${roles.length} rôles créés`);

    // 3. Assigner les permissions aux rôles
    console.log('🔗 Attribution des permissions aux rôles...');

    // Admin : toutes les permissions
    const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
    const allPermissions = await prisma.permission.findMany();
    
    for (const permission of allPermissions) {
      await prisma.role_permission.upsert({
        where: {
          role_id_permission_id: {
            role_id: adminRole!.id,
            permission_id: permission.id,
          },
        },
        update: {},
        create: {
          role_id: adminRole!.id,
          permission_id: permission.id,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }

    // Manager : permissions limitées
    const managerRole = await prisma.role.findUnique({ where: { name: 'Manager' } });
    const managerPermissions = ['users.view', 'users.create', 'users.edit', 'reports.view', 'reports.export', 'departments.view', 'projects.view', 'projects.manage'];
    
    for (const permName of managerPermissions) {
      const permission = await prisma.permission.findUnique({ where: { name: permName } });
      if (permission) {
        await prisma.role_permission.upsert({
          where: {
            role_id_permission_id: {
              role_id: managerRole!.id,
              permission_id: permission.id,
            },
          },
          update: {},
          create: {
            role_id: managerRole!.id,
            permission_id: permission.id,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }
    }

    // Employee : permissions de base
    const employeeRole = await prisma.role.findUnique({ where: { name: 'Employee' } });
    const employeePermissions = ['users.view', 'reports.view', 'departments.view', 'projects.view'];
    
    for (const permName of employeePermissions) {
      const permission = await prisma.permission.findUnique({ where: { name: permName } });
      if (permission) {
        await prisma.role_permission.upsert({
          where: {
            role_id_permission_id: {
              role_id: employeeRole!.id,
              permission_id: permission.id,
            },
          },
          update: {},
          create: {
            role_id: employeeRole!.id,
            permission_id: permission.id,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }
    }

    console.log('✅ Permissions attribuées aux rôles');

    // 4. Migrer les utilisateurs
    console.log('👥 Migration des utilisateurs...');
    const users = await prisma.user.findMany();

    for (const user of users) {
      let roleName: string;
      switch (user.role) {
        case UserRole.ROLE_ADMIN:
          roleName = 'Admin';
          break;
        case UserRole.ROLE_MANAGER:
          roleName = 'Manager';
          break;
        case UserRole.ROLE_EMPLOYEE:
          roleName = 'Employee';
          break;
        default:
          roleName = 'Employee';
      }

      const role = await prisma.role.findUnique({ where: { name: roleName } });
      if (role) {
        await prisma.user_role.upsert({
          where: {
            user_id_role_id: {
              user_id: user.id,
              role_id: role.id,
            },
          },
          update: {},
          create: {
            user_id: user.id,
            role_id: role.id,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }
    }

    console.log(`✅ ${users.length} utilisateurs migrés`);

    // 5. Vérification
    console.log('\n📊 Vérification des résultats :');
    const permissionCount = await prisma.permission.count();
    const roleCount = await prisma.role.count();
    const rolePermissionCount = await prisma.role_permission.count();
    const userRoleCount = await prisma.user_role.count();

    console.log(`  - Permissions : ${permissionCount}`);
    console.log(`  - Rôles : ${roleCount}`);
    console.log(`  - Liaisons rôle-permission : ${rolePermissionCount}`);
    console.log(`  - Liaisons utilisateur-rôle : ${userRoleCount}`);

    // Afficher les utilisateurs migrés
    const migratedUsers = await prisma.user.findMany({
      include: {
        user_role: {
          include: {
            role: true,
          },
        },
      },
    });

    console.log('\n👤 Utilisateurs migrés :');
    migratedUsers.forEach(user => {
      const newRoles = user.user_role.map(ur => ur.role?.name).join(', ');
      console.log(`  - ${user.full_name} (${user.username}): ${user.role} → ${newRoles}`);
    });

    console.log('\n🎉 Migration terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateToPermissions().catch(console.error);
