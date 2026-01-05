import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

async function main() {
    const user = await prisma.user.findFirst({
        where: { full_name: { contains: 'Tshitsho' } }
    });

    if (!user) {
        console.log('User Tshitsho not found.');
        return;
    }

    console.log(`User: ${user.full_name}, Company ID: ${user.company_id}`);

    if (user.company_id) {
        const count = await prisma.department.count({
            where: { company_id: user.company_id }
        });
        console.log(`Departments visible to user: ${count}`);
    } else {
        console.log('User has NO Company ID.');
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
