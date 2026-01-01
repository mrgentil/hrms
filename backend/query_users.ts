
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            username: true,
            role: true,
            company_id: true,
        }
    });
    console.log('USERS_LIST_START');
    console.log(JSON.stringify(users, null, 2));
    console.log('USERS_LIST_END');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
