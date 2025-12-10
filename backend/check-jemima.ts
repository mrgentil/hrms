
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const searchTerm = 'jemima';

    console.log(`Searching for user containing '${searchTerm}'...`);

    const users = await prisma.user.findMany({
        where: {
            OR: [
                { full_name: { contains: searchTerm } },
                { username: { contains: searchTerm } },
                // { work_email: { contains: searchTerm } } // work_email is nullable, keeping it simple
            ]
        },
        include: {
            role_relation: true
        }
    });

    if (users.length === 0) {
        console.log('No user found.');
        return;
    }

    for (const user of users) {
        console.log('------------------------------------------------');
        console.log(`User: ${user.full_name} (${user.username})`);
        console.log(`Legacy Role Enum: ${user.role}`);
        console.log(`Custom Role Name: ${user.role_relation?.name || 'None'}`);
        console.log(`Custom Role Description: ${user.role_relation?.description || 'None'}`);
        console.log('Permissions (from Custom Role):');

        if (user.role_relation && user.role_relation.permissions) {
            // Prisma JSON type handling
            const perms = user.role_relation.permissions;
            if (Array.isArray(perms)) {
                if (perms.length === 0) {
                    console.log('  (Empty list)');
                } else {
                    perms.forEach(p => console.log(`  - ${p}`));
                }
            } else {
                console.log('  (Not an array, raw):', perms);
            }
        } else {
            console.log('  (No custom role permissions)');
        }
        console.log('------------------------------------------------');
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
