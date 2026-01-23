
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const safia = await prisma.user.findFirst({
        where: { username: { contains: 'Safia' } },
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

    if (!safia) {
        console.log('User not found');
        return;
    }

    console.log(`User: ${safia.username}`);
    console.log(`Legacy Role: ${safia.role}`);
    console.log(`New Role ID: ${safia.role_id}`);

    if (safia.role_relation) {
        console.log(`New Role Name: ${safia.role_relation.name}`);
        const perms = safia.role_relation.role_permission.map(rp => rp.permission.name);
        console.log(`DB Permissions (${perms.length}):`);
        if (perms.includes('system.admin')) console.log(' - HAS system.admin');
        else console.log(' - MISSING system.admin');

        if (perms.includes('system.settings')) console.log(' - HAS system.settings');
        else console.log(' - MISSING system.settings');
    } else {
        console.log('No New Role Relation');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
