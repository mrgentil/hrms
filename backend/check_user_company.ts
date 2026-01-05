import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

async function main() {
    console.log('Checking users...');
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { full_name: { contains: 'Tshitsho' } },
                { username: { contains: 'Tshitsho' } }
            ]
        },
        select: { id: true, username: true, full_name: true, company_id: true, role: true }
    });

    console.log('Users found MATCHING "Tshitsho":');
    console.log(JSON.stringify(users, null, 2));

    console.log('\nChecking DEPARTMENTS for found company IDs:');
    const companyIds = users.filter((u: any) => u.company_id !== null).map((u: any) => u.company_id);

    if (companyIds.length > 0) {
        const depts = await prisma.department.findMany({
            where: { company_id: { in: companyIds } },
            select: { id: true, name: true, company_id: true }
        });
        console.log(JSON.stringify(depts, null, 2));
    } else {
        console.log('No company IDs found for user.');
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
