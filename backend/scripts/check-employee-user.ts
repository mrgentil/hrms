import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Vérifier exactement ce qu'un utilisateur Employé peut voir
 */

async function checkEmployeeUser() {
    console.log('🔍 Vérification utilisateur Employé\n');

    // 1. Trouver un utilisateur avec le rôle Employé
    const employee = await prisma.user.findFirst({
        where: {
            role_relation: {
                name: 'Employé',
            },
        },
        include: {
            role_relation: {
                include: {
                    role_permission: {
                        include: {
                            permission: true,
                        },
                    },
                },
            },
        },
    });

    if (!employee) {
        console.error('❌ Aucun utilisateur avec le rôle "Employé" trouvé');
        console.log('\n💡 Créez un utilisateur test ou assignez le rôle Employé à un utilisateur existant');
        return;
    }

    console.log(`✅ Utilisateur trouvé: ${employee.full_name} (${employee.work_email})`);
    console.log(`   Rôle: ${employee.role_relation?.name}`);
    console.log(`   ID: ${employee.id}\n`);

    if (!employee.role_relation) {
        console.error('❌ Relation rôle manquante');
        return;
    }

    // 2. Lister ses permissions
    const permissions = employee.role_relation.role_permission
        .filter(rp => rp.permission)
        .map(rp => rp.permission!.name)
        .sort();

    console.log(`📋 PERMISSIONS (${permissions.length}):`);
    console.log('═'.repeat(60));

    const grouped: Record<string, string[]> = {};
    permissions.forEach(p => {
        const prefix = p.split('.')[0];
        if (!grouped[prefix]) grouped[prefix] = [];
        grouped[prefix].push(p);
    });

    Object.entries(grouped).forEach(([group, perms]) => {
        console.log(`\n${group.toUpperCase()}:`);
        perms.forEach(p => console.log(`   ✓ ${p}`));
    });

    console.log('\n' + '═'.repeat(60));

    // 3. Simuler le filtre backend pour les menus
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

    // Filtrer comme le backend le fait
    const filteredMenus = allMenus
        .filter((menu) => {
            if (!menu.permission) return true;
            return permissions.includes(menu.permission.name);
        })
        .map((menu) => ({
            ...menu,
            children: menu.children.filter((child) => {
                if (!child.permission) return true;
                return permissions.includes(child.permission.name);
            }),
        }))
        .filter((menu) => menu.path || menu.children.length > 0);

    console.log(`\n📂 MENUS VISIBLES (${filteredMenus.length}):`);
    console.log('═'.repeat(60));

    filteredMenus.forEach(menu => {
        const icon = menu.icon || '📋';
        console.log(`\n${icon} ${menu.name}`);
        if (menu.path) console.log(`   Path: ${menu.path}`);
        if (menu.children.length > 0) {
            console.log(`   Sous-menus (${menu.children.length}):`);
            menu.children.forEach(child => {
                console.log(`      ${child.icon || '•'} ${child.name} → ${child.path}`);
            });
        }
    });

    console.log('\n' + '═'.repeat(60));

    // 4. Identifier les menus cachés
    const hiddenMenus = allMenus.filter(m => {
        const isInFiltered = filteredMenus.some(fm => fm.id === m.id);
        return !isInFiltered;
    });

    if (hiddenMenus.length > 0) {
        console.log(`\n❌ MENUS CACHÉS (${hiddenMenus.length}):`);
        console.log('═'.repeat(60));

        hiddenMenus.forEach(menu => {
            const requiredPerm = menu.permission?.name || 'Aucune';
            const hasIt = !menu.permission || permissions.includes(menu.permission.name);

            console.log(`\n${menu.icon || '📋'} ${menu.name}`);
            console.log(`   Permission requise: ${requiredPerm}`);
            console.log(`   Permission possédée: ${hasIt ? 'OUI' : 'NON'}`);

            if (!hasIt && menu.permission) {
                console.log(`   ⚠️  MANQUANT: ${menu.permission.name}`);
            }
        });
    }

    console.log('\n');
}

checkEmployeeUser()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
