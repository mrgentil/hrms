
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Hardcoded legacy permissions from RolesService (simplified for check)
const LEGACY_PERMISSIONS: any = {
    'ROLE_SUPER_ADMIN': ['system.admin', 'system.settings'],
    'ROLE_ADMIN': ['system.admin', 'system.settings'], // Added recently
    'ROLE_RH': ['system.admin', 'system.settings'], // Added recently
};

async function main() {
    console.log('--- Checking Menus ---');
    const menus = await prisma.menu_item.findMany({
        where: {
            OR: [
                { name: 'Administration' },
                { name: 'Configuration Entreprise' }
            ]
        },
        select: {
            id: true,
            name: true,
            is_active: true,
            section: true,
            parent_id: true,
            permission: { select: { name: true } }
        }
    });
    console.log(JSON.stringify(menus, null, 2));

    console.log('\n--- Checking User Safia ---');
    const safia = await prisma.user.findFirst({
        where: {
            OR: [
                { first_name: { contains: 'Safia' } },
                { username: { contains: 'Safia' } }
            ]
        },
        include: {
            role_relation: {
                include: {
                    role_permission: {
                        include: {
                            permission: true
                        }
                    }
                }
            }
        }
    });

    if (safia) {
        console.log(`User found: ${safia.username} (ID: ${safia.id}, Role: ${safia.role})`);

        const dbPermissions = safia.role_relation?.role_permission.map(rp => rp.permission.name) || [];
        const legacyPermissions = LEGACY_PERMISSIONS[safia.role] || [];

        // Note: This matches RolesService.getUserPermissions logic roughly
        const allPermissions = Array.from(new Set([...dbPermissions, ...legacyPermissions]));

        console.log(`Total Effective Permissions: ${allPermissions.length}`);
        console.log('Has system.admin?', allPermissions.includes('system.admin'));
        console.log('Has system.settings?', allPermissions.includes('system.settings'));

        if (allPermissions.includes('system.admin') && allPermissions.includes('system.settings')) {
            console.log("✅ User SHOULD see the menus.");
        } else {
            console.log("❌ User MISSING permissions.");
        }

    } else {
        console.log('User Safia not found');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
