
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDepartments() {
    try {
        const departments = await prisma.department.findMany({
            where: { company_id: 2 }
        });
        console.log('--- Departments for Company 2 ---');
        console.log(departments);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkDepartments();
