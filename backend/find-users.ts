
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { first_name: { contains: 'Safia' } },
                { last_name: { contains: 'Safia' } },
                { username: { contains: 'Safia' } }
            ]
        },
        include: {
            role_info: true
        }
    });

    console.log('Found users:', JSON.stringify(users, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
