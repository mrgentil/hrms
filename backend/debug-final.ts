
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking User ---');
    // Use OR to cover bases, outputting fields found in schema or assumed
    const users = await prisma.user.findMany({
        where: {
            username: { contains: 'Safia' }
        },
        include: {
            role_relation: {
                include: {
                    role_permission: {
                        include: { permission: true }
                    }
                }
            }
        }
    });
    console.log(JSON.stringify(users, null, 2));

    console.log('\n--- Checking Menus ---');
    const menus = await prisma.menu_item.findMany({
        where: {
            name: { in: ['Administration', 'Configuration Entreprise'] }
        },
        include: {
            permission: true,
            parent: true
        }
    });
    console.log(JSON.stringify(menus, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
