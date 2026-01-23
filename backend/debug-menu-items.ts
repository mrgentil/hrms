
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Inspecting Menu Items ---');
    const menus = await prisma.menu_item.findMany({
        where: {
            OR: [
                { name: 'Administration' },
                { name: 'Configuration Entreprise' }
            ]
        },
        include: {
            permission: true,
            parent: true,
            children: true
        }
    });
    console.log(JSON.stringify(menus, null, 2));

    console.log('\n--- Inspecting Permissions ---');
    const permissions = await prisma.permission.findMany({
        where: {
            name: { in: ['system.admin', 'system.settings'] }
        }
    });
    console.log(JSON.stringify(permissions, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
