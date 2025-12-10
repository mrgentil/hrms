
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const userId = 4;
    console.log(`Fetching details for User ID ${userId}...`);

    const user = await prisma.user.findUnique({
        where: { id: userId },
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

    if (!user) {
        console.log('User not found.');
        return;
    }

    console.log('Use Details:');
    console.log(`Name: ${user.full_name}`);
    console.log(`Username: ${user.username}`);
    console.log(`Email: ${user.work_email}`);
    console.log(`Role (Classic): ${user.role}`);
    console.log(`Role (Custom): ${user.role_relation?.name || 'Aucun usage de rôle personnalisé'}`);

    if (user.role_relation) {
        console.log(`Description: ${user.role_relation.description}`);

        // Check relational permissions
        const relationalPerms = user.role_relation.role_permission.map(rp => rp.permission?.name).filter(Boolean);

        console.log(`Permissions Count (Relational): ${relationalPerms.length}`);
        if (relationalPerms.length > 0) {
            console.log('Permissions List (from role_permission table):');
            relationalPerms.sort().forEach(p => console.log(`- ${p}`));
        } else {
            console.log('  (No permissions found in role_permission table)');
        }

        // Check JSON permissions (legacy/backup)
        const jsonPerms = user.role_relation.permissions;
        if (Array.isArray(jsonPerms) && jsonPerms.length > 0) {
            console.log('Permissions List (from JSON field):');
            (jsonPerms as string[]).sort().forEach(p => console.log(`- ${p}`));
        }
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
