
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const username = 'Jemima'; // Assuming this is the user testing based on previous context
    console.log(`Checking permissions for user: ${username}...`);

    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { username: username },
                { full_name: { contains: username } }
            ]
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

    if (!user) {
        console.log('User not found');
        return;
    }

    console.log(`User found: ${user.full_name} (ID: ${user.id})`);
    console.log(`Role: ${user.role_relation?.name}`);

    const permissions = user.role_relation?.role_permission.map(rp => rp.permission?.name) || [];
    console.log('Permissions:', permissions);

    if (permissions.includes('expenses.approve')) {
        console.log('✅ Has expenses.approve permission');
    } else {
        console.log('❌ MISSING expenses.approve permission');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
