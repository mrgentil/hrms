import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Mise à jour des permissions Paie...');

    // 1. Définir les permissions manquantes
    const payrollPermissions = [
        /* Paie */
        { name: 'payroll.view', description: 'Voir la paie (tous)' },
        { name: 'payroll.view_own', description: 'Voir sa paie' },
        { name: 'payroll.manage', description: 'Gérer la paie' },
        { name: 'payroll.advances', description: 'Gérer les avances sur salaire' },
        { name: 'payroll.bonuses', description: 'Gérer les primes' },
        { name: 'payroll.fund_requests', description: 'Gérer les demandes de fonds' },

        /* Avantages */
        { name: 'benefits.view', description: 'Voir les avantages' },
        { name: 'benefits.manage', description: 'Gérer les avantages' },
        { name: 'benefits.enroll', description: 'S\'inscrire aux avantages' },
    ];

    const adminRoleNames = ['Super Admin', 'Admin', 'RH']; // Roles qui doivent avoir accès

    // 2. Créer les permissions
    console.log('🔐 Vérification/Création des permissions...');
    const permissionIds: number[] = [];

    for (const perm of payrollPermissions) {
        const p = await prisma.permission.upsert({
            where: { name: perm.name },
            update: { description: perm.description },
            create: {
                name: perm.name,
                description: perm.description,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
        permissionIds.push(p.id);
        console.log(`   - ${perm.name} checked/created`);
    }

    // 3. Assigner aux rôles Admin/RH
    console.log('👥 Assignation aux rôles Admin & RH...');

    const roles = await prisma.role.findMany({
        where: { name: { in: adminRoleNames } }
    });

    for (const role of roles) {
        console.log(`   role: ${role.name}`);
        for (const permId of permissionIds) {
            await prisma.role_permission.upsert({
                where: {
                    role_id_permission_id: {
                        role_id: role.id,
                        permission_id: permId
                    }
                },
                update: {},
                create: {
                    role_id: role.id,
                    permission_id: permId,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
        }
        console.log(`   ✅ Permissions assignées à ${role.name}`);
    }

    console.log('\n✨ Mise à jour terminée avec succès !');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
