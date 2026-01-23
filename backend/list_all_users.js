
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, username: true, work_email: true }
        });
        console.log('--- All Users ---');
        users.forEach(u => console.log(`${u.id}: ${u.username} (${u.work_email})`));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

listUsers();
