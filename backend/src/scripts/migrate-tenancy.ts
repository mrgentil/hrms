import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting migration...');

    // 1. Check if default company exists, if not create it
    let defaultCompany = await prisma.company.findFirst({
        where: { name: 'Efficia Default' },
    });

    if (!defaultCompany) {
        console.log('Creating default company...');
        defaultCompany = await prisma.company.create({
            data: {
                name: 'Efficia Default',
                country: 'France', // Adjust as needed
                currency: 'EUR',  // Adjust as needed
            },
        });
        console.log(`Default company created: ${defaultCompany.id}`);
    } else {
        console.log(`Default company already exists: ${defaultCompany.id}`);
    }

    // 2. Assign all users without company to the default company
    const result = await prisma.user.updateMany({
        where: {
            company_id: null,
        },
        data: {
            company_id: defaultCompany.id,
        },
    });

    console.log(`Updated ${result.count} users to company ${defaultCompany.id}`);

    console.log('Migration completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
