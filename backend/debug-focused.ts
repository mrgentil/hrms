
import { PrismaClient } from '@prisma/client';
import { RolesService, SYSTEM_PERMISSIONS } from './src/roles/roles.service';
import { PermissionsService } from './src/permissions/permissions.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './src/prisma/prisma.service';

const prisma = new PrismaClient();

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
    console.table(menus);

    console.log('\n--- Checking User Safia ---');
    const safia = await prisma.user.findFirst({
        where: {
            OR: [
                { first_name: { contains: 'Safia' } },
                { username: { contains: 'Safia' } }
            ]
        }
    });

    if (safia) {
        console.log(`User found: ${safia.username} (ID: ${safia.id}, Role: ${safia.role})`);

        // Simulate RolesService logic (simplified)
        const rolesService = new RolesService(new PrismaService());
        const permissions = await rolesService.getUserPermissions(safia.id);
        console.log(`Permissions count: ${permissions.length}`);
        console.log('Has system.admin?', permissions.includes('system.admin'));
        console.log('Has system.settings?', permissions.includes('system.settings'));

        // Check missing permissions
        if (!permissions.includes('system.admin')) console.warn('MISSING: system.admin');
        if (!permissions.includes('system.settings')) console.warn('MISSING: system.settings');
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
