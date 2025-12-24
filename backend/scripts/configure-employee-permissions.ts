import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script de configuration COMPLÈTE des permissions du rôle Employé
 * 
 * Permissions ajoutées :
 * - Formation & Développement
 * - Paie & Rémunération (propres données)
 * - Performance & Évaluations (propres données)
 * - Assets & Équipements (propres données)
 * - Planification & Réservation de salles
 * - Bien-être & Engagement
 */

async function main() {
    console.log('🚀 Configuration COMPLÈTE des permissions du rôle Employé...\n');

    // 1. Trouver le rôle "Employé"
    const employeeRole = await prisma.role.findFirst({
        where: { name: 'Employé' },
    });

    if (!employeeRole) {
        console.error('❌ Le rôle "Employé" n\'existe pas dans la base de données.');
        return;
    }

    console.log(`✅ Rôle trouvé: ${employeeRole.name} (ID: ${employeeRole.id})\n`);

    // 2. Liste COMPLÈTE des permissions pour un employé
    const employeePermissions = [
        // Base
        'departments.view',
        'positions.view',
        'announcements.view',
        'users.view',

        // Formation & Développement
        'training.view',
        'training.register',
        'training.certifications',

        // Paie & Rémunération (self-service)
        'payroll.view_own',
        'payroll.advances',
        'payroll.fund_requests',

        // Performance & Évaluations (self-service)
        'performance.view_own',
        'performance.reviews',
        'performance.recognition',

        // Assets & Équipements (self-service)
        'assets.view_own',
        'assets.request',

        // Planification & Ressources
        'planning.view',
        'planning.rooms',
        'planning.remote_work',

        // Pointage
        'attendance.view_own',
        'attendance.clock',
        'attendance.correct',

        // Bien-être & Engagement
        'wellbeing.view',
        'wellbeing.surveys',
        'wellbeing.events',

        // Congés
        'leaves.view',
        'leaves.view_team',
    ];

    console.log(`🎯 Configuration de ${employeePermissions.length} permissions...\n`);

    let assigned = 0;
    let alreadyExists = 0;
    let notFound = 0;

    for (const permissionName of employeePermissions) {
        // Trouver la permission
        const permission = await prisma.permission.findUnique({
            where: { name: permissionName },
        });

        if (!permission) {
            console.log(`   ⚠️  Permission "${permissionName}" non trouvée dans la BDD`);
            notFound++;
            continue;
        }

        // Vérifier si déjà assignée
        const existing = await prisma.role_permission.findUnique({
            where: {
                role_id_permission_id: {
                    role_id: employeeRole.id,
                    permission_id: permission.id,
                },
            },
        });

        if (existing) {
            alreadyExists++;
            continue;
        }

        // Créer l'assignation
        try {
            await prisma.role_permission.create({
                data: {
                    role_id: employeeRole.id,
                    permission_id: permission.id,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
            console.log(`   ✅ ${permissionName}`);
            assigned++;
        } catch (error) {
            console.error(`   ❌ Erreur pour "${permissionName}":`, error);
        }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('📊 RÉSUMÉ DE LA CONFIGURATION');
    console.log('═'.repeat(60));
    console.log(`✅ Nouvelles permissions assignées: ${assigned}`);
    console.log(`⏭️  Permissions déjà existantes: ${alreadyExists}`);
    console.log(`⚠️  Permissions non trouvées: ${notFound}`);
    console.log('═'.repeat(60));
    console.log('');

    // 3. Afficher le résumé final
    const finalRole = await prisma.role.findUnique({
        where: { id: employeeRole.id },
        include: {
            role_permission: {
                include: {
                    permission: true,
                },
            },
        },
    });

    const finalPermissions = finalRole?.role_permission
        .map((rp) => rp.permission?.name)
        .filter(Boolean)
        .sort() || [];

    console.log('📋 PERMISSIONS FINALES DU RÔLE "EMPLOYÉ":');
    console.log('═'.repeat(60));
    console.log(`Total: ${finalPermissions.length} permissions\n`);

    // Grouper par module
    const grouped: Record<string, string[]> = {
        'Base': [],
        'Formation': [],
        'Paie': [],
        'Performance': [],
        'Assets': [],
        'Planning': [],
        'Pointage': [],
        'Bien-être': [],
        'Congés': [],
        'Autres': [],
    };

    finalPermissions.forEach(perm => {
        if (!perm) return;
        if (perm.startsWith('training.')) grouped['Formation'].push(perm);
        else if (perm.startsWith('payroll.')) grouped['Paie'].push(perm);
        else if (perm.startsWith('performance.')) grouped['Performance'].push(perm);
        else if (perm.startsWith('assets.')) grouped['Assets'].push(perm);
        else if (perm.startsWith('planning.')) grouped['Planning'].push(perm);
        else if (perm.startsWith('attendance.')) grouped['Pointage'].push(perm);
        else if (perm.startsWith('wellbeing.')) grouped['Bien-être'].push(perm);
        else if (perm.startsWith('leaves.')) grouped['Congés'].push(perm);
        else if (perm.startsWith('departments.') || perm.startsWith('positions.') ||
            perm.startsWith('announcements.') || perm.startsWith('users.')) {
            grouped['Base'].push(perm);
        }
        else grouped['Autres'].push(perm);
    });

    Object.entries(grouped).forEach(([group, perms]) => {
        if (perms.length > 0) {
            console.log(`\n${group} (${perms.length}):`);
            perms.forEach(p => console.log(`   ✓ ${p}`));
        }
    });

    console.log('\n' + '═'.repeat(60));
    console.log('\n💡 PROCHAINES ÉTAPES:');
    console.log('   1. Redémarrez le serveur backend');
    console.log('   2. Déconnectez-vous et reconnectez-vous');
    console.log('   3. Vérifiez l\'accès à tous les modules\n');
}

main()
    .catch((e) => {
        console.error('\n❌ ERREUR:', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
