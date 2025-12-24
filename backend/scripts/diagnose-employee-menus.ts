import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script de diagnostic: Pourquoi les menus ne s'affichent pas pour un employé ?
 */

async function diagnoseMenuIssue() {
    console.log('🔍 Diagnostic des menus pour le rôle Employé\n');
    console.log('═'.repeat(80));

    // 1. Récupérer le rôle Employé
    const employeeRole = await prisma.role.findFirst({
        where: { name: 'Employé' },
        include: {
            role_permission: {
                include: {
                    permission: { select: { id: true, name: true } },
                },
            },
        },
    });

    if (!employeeRole) {
        console.error('❌ Rôle "Employé" non trouvé');
        return;
    }

    const userPermissions = employeeRole.role_permission.map(rp => rp.permission?.name).filter(Boolean) as string[];

    console.log(`✅ Rôle: ${employeeRole.name}`);
    console.log(`📋 Permissions assignées: ${userPermissions.length}`);
    console.log('');

    // 2. Récupérer tous les menus actifs
    const allMenus = await prisma.menu_item.findMany({
        where: { is_active: true },
        orderBy: [{ section: 'asc' }, { sort_order: 'asc' }],
        include: {
            permission: { select: { name: true } },
            children: {
                where: { is_active: true },
                orderBy: { sort_order: 'asc' },
                include: {
                    permission: { select: { name: true } },
                },
            },
        },
    });

    console.log(`📂 Total de menus actifs: ${allMenus.length}\n`);

    // 3. Analyser chaque menu
    let visibleCount = 0;
    let hiddenCount = 0;

    console.log('📊 ANALYSE DES MENUS:\n');

    allMenus.forEach(menu => {
        const requiresPermission = menu.permission?.name;
        const hasPermission = !requiresPermission || userPermissions.includes(requiresPermission);

        // Filtrer les enfants visibles
        const visibleChildren = menu.children.filter(child => {
            const childRequiresPermission = child.permission?.name;
            return !childRequiresPermission || userPermissions.includes(childRequiresPermission);
        });

        // Un menu est visible si:
        // 1. Il a la permission requise (ou pas de permission)
        // 2. Il a un path OU au moins un enfant visible
        const isVisible = hasPermission && (menu.path || visibleChildren.length > 0);

        const status = isVisible ? '✅' : '❌';
        const icon = menu.icon || '📋';

        console.log(`${status} ${icon} ${menu.name} (${menu.section})`);

        if (requiresPermission) {
            console.log(`   Permission requise: ${requiresPermission}`);
            console.log(`   Permission possédée: ${hasPermission ? 'OUI' : 'NON'}`);
        } else {
            console.log(`   Permission requise: AUCUNE (accessible à tous)`);
        }

        if (menu.children.length > 0) {
            console.log(`   Sous-menus: ${menu.children.length} total, ${visibleChildren.length} visibles`);

            menu.children.forEach(child => {
                const childRequiresPermission = child.permission?.name;
                const childHasPermission = !childRequiresPermission || userPermissions.includes(childRequiresPermission);
                const childStatus = childHasPermission ? '   ✓' : '   ✗';
                console.log(`${childStatus} ${child.icon || '•'} ${child.name}${childRequiresPermission ? ` [${childRequiresPermission}]` : ''}`);
            });
        }

        if (isVisible) {
            visibleCount++;
        } else {
            hiddenCount++;
            if (!hasPermission && requiresPermission) {
                console.log(`   ⚠️  PROBLÈME: Permission manquante - ${requiresPermission}`);
            }
            if (!menu.path && visibleChildren.length === 0) {
                console.log(`   ⚠️  PROBLÈME: Pas de path et aucun enfant visible`);
            }
        }

        console.log('');
    });

    console.log('═'.repeat(80));
    console.log('\n📊 RÉSUMÉ:');
    console.log(`   Menus visibles: ${visibleCount}`);
    console.log(`   Menus cachés: ${hiddenCount}`);
    console.log('');

    // 4. Identifier les permissions des menus manquantes
    const allMenuPermissions = new Set<string>();
    allMenus.forEach(menu => {
        if (menu.permission?.name) allMenuPermissions.add(menu.permission.name);
        menu.children.forEach(child => {
            if (child.permission?.name) allMenuPermissions.add(child.permission.name);
        });
    });

    const missingPermissions = Array.from(allMenuPermissions).filter(
        p => !userPermissions.includes(p)
    );

    if (missingPermissions.length > 0) {
        console.log('\n⚠️  PERMISSIONS MANQUANTES:');
        console.log('   Ces permissions sont requises par des menus mais non assignées au rôle Employé:');
        missingPermissions.forEach(p => console.log(`   - ${p}`));
        console.log('');
        console.log('💡 SOLUTION:');
        console.log('   Exécutez à nouveau le script de configuration des permissions:');
        console.log('   npx ts-node scripts/configure-employee-permissions.ts');
    } else {
        console.log('\n✅ Toutes les permissions requises par les menus sont assignées!');
    }

    console.log('');
}

diagnoseMenuIssue()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
