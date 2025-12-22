
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    const perm = await prisma.permission.findFirst({
        where: { name: 'announcements.view' },
    });
    console.log(perm ? 'EXISTS' : 'MISSING');
}

check()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
