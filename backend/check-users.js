const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Diagnostic de la base de données...');

    const userCount = await prisma.user.count();
    console.log(`\n👥 Nombre d'utilisateurs : ${userCount}`);

    if (userCount > 0) {
        const users = await prisma.user.findMany({
            take: 5,
            select: { id: true, full_name: true, email: true, created_at: true }
        });
        console.log('\n5 derniers utilisateurs :');
        console.table(users);
    } else {
        console.log('❌ Aucun utilisateur trouvé.');

        // Vérifier les dépendances
        const deptCount = await prisma.department.count();
        const posCount = await prisma.position.count();
        const roleCount = await prisma.role.count();

        console.log(`\nDépendances :`);
        console.log(`- Départements: ${deptCount}`);
        console.log(`- Postes: ${posCount}`);
        console.log(`- Rôles: ${roleCount}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
