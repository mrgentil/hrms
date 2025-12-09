import { PrismaClient, UserRole } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed initial - Création des données de base...\n');

  // ============================================
  // 1. PERMISSIONS
  // ============================================
  console.log('🔐 Création des permissions...');
  
  const permissions = [
    { name: 'users.view', description: 'Voir les utilisateurs' },
    { name: 'users.create', description: 'Créer des utilisateurs' },
    { name: 'users.edit', description: 'Modifier des utilisateurs' },
    { name: 'users.delete', description: 'Supprimer des utilisateurs' },
    { name: 'projects.view', description: 'Voir les projets' },
    { name: 'projects.create', description: 'Créer des projets' },
    { name: 'projects.edit', description: 'Modifier des projets' },
    { name: 'projects.delete', description: 'Supprimer des projets' },
    { name: 'tasks.view', description: 'Voir les tâches' },
    { name: 'tasks.create', description: 'Créer des tâches' },
    { name: 'tasks.edit', description: 'Modifier des tâches' },
    { name: 'tasks.delete', description: 'Supprimer des tâches' },
    { name: 'attendance.view', description: 'Voir les présences' },
    { name: 'attendance.manage', description: 'Gérer les présences' },
    { name: 'leaves.view', description: 'Voir les congés' },
    { name: 'leaves.manage', description: 'Gérer les congés' },
    { name: 'settings.view', description: 'Voir les paramètres' },
    { name: 'settings.manage', description: 'Gérer les paramètres' },
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
  console.log(`✅ ${permissions.length} permissions créées\n`);

  // ============================================
  // 2. RÔLES
  // ============================================
  console.log('👥 Création des rôles...');

  const roles = [
    { name: 'Super Admin', description: 'Accès complet au système', color: '#dc2626', icon: 'shield', is_system: true },
    { name: 'Admin', description: 'Administrateur', color: '#ea580c', icon: 'settings', is_system: true },
    { name: 'RH', description: 'Ressources Humaines', color: '#0891b2', icon: 'users', is_system: true },
    { name: 'Manager', description: 'Chef d\'équipe', color: '#7c3aed', icon: 'briefcase', is_system: false },
    { name: 'Employé', description: 'Employé standard', color: '#059669', icon: 'user', is_system: false },
  ];

  const createdRoles: Record<string, number> = {};
  
  for (const role of roles) {
    const created = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
        description: role.description,
        color: role.color,
        icon: role.icon,
        is_system: role.is_system,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    createdRoles[role.name] = created.id;
  }
  console.log(`✅ ${roles.length} rôles créés\n`);

  // ============================================
  // 3. ASSOCIER PERMISSIONS AUX RÔLES
  // ============================================
  console.log('🔗 Association des permissions aux rôles...');

  const allPermissions = await prisma.permission.findMany();
  const superAdminRole = await prisma.role.findFirst({ where: { name: 'Super Admin' } });
  const adminRole = await prisma.role.findFirst({ where: { name: 'Admin' } });

  if (superAdminRole) {
    for (const perm of allPermissions) {
      await prisma.role_permission.upsert({
        where: {
          role_id_permission_id: { role_id: superAdminRole.id, permission_id: perm.id }
        },
        update: {},
        create: {
          role_id: superAdminRole.id,
          permission_id: perm.id,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }
  }

  if (adminRole) {
    for (const perm of allPermissions) {
      await prisma.role_permission.upsert({
        where: {
          role_id_permission_id: { role_id: adminRole.id, permission_id: perm.id }
        },
        update: {},
        create: {
          role_id: adminRole.id,
          permission_id: perm.id,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }
  }
  console.log('✅ Permissions associées aux rôles\n');

  // ============================================
  // 4. UTILISATEURS
  // ============================================
  console.log('👤 Création des utilisateurs...');

  const hashedPassword = await bcryptjs.hash('admin123', 10);

  const users = [
    { 
      username: 'Tshitsho', 
      full_name: 'Tshitsho Bilongo Bédi', 
      work_email: 'tshitshob@gmail.com',
      role: UserRole.ROLE_SUPER_ADMIN,
      role_id: createdRoles['Super Admin'],
    },
    { 
      username: 'admin', 
      full_name: 'Administrateur', 
      work_email: 'admin@efficia.com',
      role: UserRole.ROLE_ADMIN,
      role_id: createdRoles['Admin'],
    },
    { 
      username: 'MrGentil', 
      full_name: 'Mr Gentil', 
      work_email: 'gentil@efficia.com',
      role: UserRole.ROLE_EMPLOYEE,
      role_id: createdRoles['Employé'],
    },
  ];

  for (const user of users) {
    const existing = await prisma.user.findFirst({ where: { username: user.username } });
    if (!existing) {
      await prisma.user.create({
        data: {
          username: user.username,
          password: hashedPassword,
          full_name: user.full_name,
          work_email: user.work_email,
          role: user.role,
          role_id: user.role_id,
          active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      console.log(`  ✅ Utilisateur ${user.username} créé`);
    } else {
      console.log(`  ℹ️ Utilisateur ${user.username} existe déjà`);
    }
  }

  console.log('\n🎉 Seed initial terminé !');
  console.log('\n📋 Utilisateurs créés:');
  console.log('   - Username: Tshitsho | Password: admin123');
  console.log('   - Username: admin | Password: admin123');
  console.log('   - Username: MrGentil | Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
