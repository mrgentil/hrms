import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

async function main() {
    console.log('Searching for Tshitsho...');
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { full_name: { contains: 'Tshitsho' } },
                { username: { contains: 'Tshitsho' } }
            ]
        }
    });

    if (users.length === 0) {
        console.log('No user found matching "Tshitsho".');

        // Fallback: list first 5 users
        const allUsers = await prisma.user.findMany({ take: 5 });
        console.log('Sample users:', allUsers.map(u => `${u.id}: ${u.full_name} (Company: ${u.company_id})`));
        return;
    }

    for (const user of users) {
        console.log(`Found user: ${user.full_name} (ID: ${user.id}). Current Company ID: ${user.company_id}`);

        if (user.company_id !== 1) {
            await prisma.user.update({
                where: { id: user.id },
                data: { company_id: 1 }
            });
            console.log(`Updated user ${user.id} to Company ID 1.`);
        } else {
            console.log(`User ${user.id} is already in Company ID 1.`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
