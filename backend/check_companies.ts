
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.company.count();
    console.log(`COMPANIES_COUNT: ${count}`);

    const companies = await prisma.company.findMany();
    console.log('COMPANIES_LIST:');
    console.log(JSON.stringify(companies, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
