import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSalaries() {
    try {
        // Check all users with financial info
        const usersWithFinancial = await prisma.user.findMany({
            where: {
                user_financial_info: {
                    some: {}
                }
            },
            include: {
                user_financial_info: true,
            },
            take: 10,
        });

        console.log('\n=== UTILISATEURS AVEC INFORMATIONS FINANCIÈRES ===\n');
        console.log(`Total: ${usersWithFinancial.length} utilisateurs\n`);

        usersWithFinancial.forEach(user => {
            const financial = user.user_financial_info[0];
            console.log(`👤 ${user.full_name} (${user.username})`);
            console.log(`   Salaire base: ${financial?.salary_basic || 0} $`);
            console.log(`   Salaire brut: ${financial?.salary_gross || 0} $`);
            console.log(`   Salaire net: ${financial?.salary_net || 0} $`);
            console.log('');
        });

        // Count total users
        const totalUsers = await prisma.user.count();
        const usersWithoutFinancial = totalUsers - usersWithFinancial.length;

        console.log('\n=== RÉSUMÉ ===');
        console.log(`Total utilisateurs: ${totalUsers}`);
        console.log(`Avec informations financières: ${usersWithFinancial.length}`);
        console.log(`Sans informations financières: ${usersWithoutFinancial}`);

    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSalaries();
