
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const menus = await prisma.menu_item.findMany({
        where: {
            name: { in: ['Administration', 'Configuration Entreprise'] }
        },
        include: {
            permission: true,
            parent: true
        }
    });

    console.log('--- Menus ---');
    menus.forEach(m => {
        console.log(`Menu: ${m.name} (ID: ${m.id})`);
        console.log(`  Active: ${m.is_active}`);
        console.log(`  Section: ${m.section}`);
        console.log(`  Parent: ${m.parent?.name} (ID: ${m.parent_id})`);
        console.log(`  Permission: ${m.permission?.name} (ID: ${m.permission_id})`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
