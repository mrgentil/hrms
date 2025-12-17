
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SYSTEM_PERMISSIONS = {
    EXPENSES_APPROVE: 'expenses.approve',
};

async function main() {
    console.log('Testing approver query...');
    try {
        const potentialApprovers = await prisma.user.findMany({
            where: {
                active: true,
                role_relation: {
                    role_permission: {
                        some: {
                            permission: {
                                name: SYSTEM_PERMISSIONS.EXPENSES_APPROVE,
                            },
                        },
                    },
                },
            },
            include: {
                role_relation: true,
            },
        });

        console.log('Potential Approvers Found:', potentialApprovers.length);
        potentialApprovers.forEach(u => {
            console.log(`- ${u.full_name} (${u.role_relation?.name})`);
        });

        // Test filter logic
        const targetUsers = potentialApprovers.filter((u) => {
            const roleName = u.role_relation?.name?.toLowerCase() || '';
            const isManager = roleName.includes('manager');
            const isDirector = roleName.includes('directeur') || roleName.includes('director');
            return !isManager && !isDirector;
        });

        console.log('Filtered Target Users:', targetUsers.length);
        targetUsers.forEach(u => {
            console.log(`- ${u.full_name} (${u.role_relation?.name})`);
        });

    } catch (error) {
        console.error('Query Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
