
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    console.log('Listing first 50 users...');

    const users = await prisma.user.findMany({
        take: 50,
        select: {
            id: true,
            username: true,
            full_name: true,
            work_email: true,
            role_relation: { select: { name: true } }
        },
    });

    if (users.length === 0) {
        console.log('No users found in database.');
        return;
    }

    const lines = users.map(u => `[${u.id}] ${u.full_name} / ${u.username} (${u.work_email || 'No Email'}) - Role: ${u.role_relation?.name || 'N/A'}`);
    fs.writeFileSync('users.txt', lines.join('\n'));
    console.log('Wrote users to users.txt');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
