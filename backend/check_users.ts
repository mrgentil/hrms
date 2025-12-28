
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                full_name: true,
                active: true,
            }
        });
        console.log('Users status:');
        users.forEach(u => console.log(`- ${u.username} (${u.full_name}): active=${u.active}`));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
