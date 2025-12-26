import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listPermissions() {
    console.log('📋 Permissions in Database:');
    const perms = await prisma.permission.findMany({
        orderBy: { name: 'asc' }
    });

    console.table(perms.map(p => ({ id: p.id, name: p.name, description: p.description })));
    console.log(`Total: ${perms.length}`);
}

listPermissions()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
