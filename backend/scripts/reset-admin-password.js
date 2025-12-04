const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log("Recherche des utilisateurs admin...");

    // Trouver tous les super admins
    const admins = await prisma.user.findMany({
      where: { role: 'ROLE_SUPER_ADMIN' },
      select: { id: true, username: true, full_name: true, work_email: true }
    });

    if (admins.length === 0) {
      console.log('Aucun super administrateur trouvé.');
      return;
    }

    console.log('Administrateurs trouvés:');
    admins.forEach(admin => {
      console.log(`  - ID: ${admin.id}, Username: ${admin.username}, Nom: ${admin.full_name}`);
    });

    // Réinitialiser le mot de passe du premier admin
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const updated = await prisma.user.update({
      where: { id: admins[0].id },
      data: { 
        password: hashedPassword,
        updated_at: new Date()
      }
    });

    console.log(`\n✅ Mot de passe réinitialisé pour: ${updated.username}`);
    console.log('📧 Username:', updated.username);
    console.log('🔑 Nouveau mot de passe: admin123');
    
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
