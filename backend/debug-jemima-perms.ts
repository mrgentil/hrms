
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Copy of logic from RolesService.getUserPermissions
async function getUserPermissions(userId: number) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
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

    if (!user) return null;

    const relationPermissions = user.role_relation?.role_permission?.map(rp => rp.permission?.name).filter(Boolean) || [];

    // Also check JSON permissions if any
    let jsonPermissions: string[] = [];
    if (user.role_relation?.permissions && Array.isArray(user.role_relation.permissions)) {
        jsonPermissions = user.role_relation.permissions as string[];
    }

    const all = Array.from(new Set([...relationPermissions, ...jsonPermissions]));
    return {
        roleName: user.role_relation?.name,
        permissions: all
    };
}

async function main() {
    console.log('Searching for Finance user...');

    // Try to find by role name
    const users = await prisma.user.findMany({
        where: {
            role_relation: {
                name: { contains: 'Finance' } // 'Directeur Finance' or 'Financier'
            }
        },
        take: 5
    });

    console.log(`Found ${users.length} finance users.`);

    for (const u of users) {
        console.log(`Checking user: ${u.full_name} (${u.id})`);
        const result = await getUserPermissions(u.id);

        if (!result) {
            console.log('User not found deep check?');
            continue;
        }

        console.log(`Role: ${result.roleName}`);
        console.log(`Has 'users.view'? ${result.permissions.includes('users.view')}`);
        console.log(`Has 'expenses.approve'? ${result.permissions.includes('expenses.approve')}`);
        console.log(' All Perms:', result.permissions);
        console.log('---');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
