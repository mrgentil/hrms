
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Searching for Super Admins...');
    const superAdmins = await prisma.user.findMany({
        where: {
            role: 'ROLE_SUPER_ADMIN'
        }
    });

    console.log(`Found ${superAdmins.length} Super Admins.`);

    // Get the first company (usually ID 1)
    const mainCompany = await prisma.company.findFirst({
        orderBy: { id: 'asc' }
    });

    if (!mainCompany) {
        console.error('No company found in database! Please create one first.');
        return;
    }

    console.log(`Main company found: ${mainCompany.name} (ID: ${mainCompany.id})`);

    for (const admin of superAdmins) {
        console.log(`Checking admin: ${admin.username} (ID: ${admin.id}, Company ID: ${admin.company_id})`);

        if (!admin.company_id) {
            console.log(`-> Fixing company_id for user ${admin.username}...`);
            await prisma.user.update({
                where: { id: admin.id },
                data: { company_id: mainCompany.id }
            });
            console.log('-> Fixed.');
        } else {
            console.log('-> Company ID is already set.');
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
