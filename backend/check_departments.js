const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const prisma = new PrismaClient();

async function main() {
    const departments = await prisma.department.findMany({
        select: { id: true, name: true, company_id: true }
    });
    console.log('Departments:', JSON.stringify(departments, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
