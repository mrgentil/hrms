const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log("Creation d'un super administrateur...");

    // Verifier si un super administrateur existe deja
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'ROLE_SUPER_ADMIN' },
    });

    if (existingSuperAdmin) {
      console.log('Un super administrateur existe deja :', existingSuperAdmin.username);
      return;
    }

    // Creer un super administrateur par defaut
    const hashedPassword = await bcrypt.hash('admin123', 12);

    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        full_name: 'Super Administrateur',
        work_email: 'admin@hrms.local',
        role: 'ROLE_SUPER_ADMIN',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    console.log('Utilisateur super administrateur cree avec succes !');
    console.log("Nom d'utilisateur :", admin.username);
    console.log('Mot de passe : admin123');
    console.log('IMPORTANT : changez ce mot de passe apres la premiere connexion !');
  } catch (error) {
    console.error('Erreur lors de la creation du super administrateur :', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
