const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPermissionsData() {
  try {
    console.log('🔍 Vérification des données existantes...\n');

    // Vérifier les utilisateurs actuels
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        full_name: true,
        role: true,
        active: true
      }
    });
    console.log('👥 Utilisateurs actuels:', users.length);
    users.forEach(user => {
      console.log(`  - ${user.full_name} (${user.username}): ${user.role}`);
    });

    // Vérifier les rôles existants
    const roles = await prisma.role.findMany();
    console.log('\n🎭 Rôles dans la table role:', roles.length);
    roles.forEach(role => {
      console.log(`  - ${role.name}: ${role.description || 'Pas de description'}`);
    });

    // Vérifier les permissions existantes
    const permissions = await prisma.permission.findMany();
    console.log('\n🔐 Permissions existantes:', permissions.length);
    permissions.forEach(perm => {
      console.log(`  - ${perm.name}: ${perm.description || 'Pas de description'}`);
    });

    // Vérifier les liaisons user_role
    const userRoles = await prisma.user_role.findMany({
      include: {
        user: { select: { username: true } },
        role: { select: { name: true } }
      }
    });
    console.log('\n🔗 Liaisons user_role:', userRoles.length);
    userRoles.forEach(ur => {
      console.log(`  - ${ur.user?.username} -> ${ur.role?.name}`);
    });

    // Vérifier les liaisons role_permission
    const rolePermissions = await prisma.role_permission.findMany({
      include: {
        role: { select: { name: true } },
        permission: { select: { name: true } }
      }
    });
    console.log('\n🔗 Liaisons role_permission:', rolePermissions.length);
    rolePermissions.forEach(rp => {
      console.log(`  - ${rp.role?.name} -> ${rp.permission?.name}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPermissionsData();
