
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCreate() {
    const companyId = 2;
    const name = "Test Dept " + Date.now();

    console.log(`Attempting to create department '${name}' for company ${companyId}...`);

    try {
        const existing = await prisma.department.findFirst({
            where: {
                company_id: companyId,
                name: name,
                parent_department_id: null,
            },
        });

        if (existing) {
            console.log('Conflict: Department exists.');
            return;
        }

        const department = await prisma.department.create({
            data: {
                company_id: companyId,
                name: name,
                description: "Created via test script",
                manager_user_id: null,
                parent_department_id: null,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        console.log('Success! Created department:', department);
    } catch (e) {
        console.error('Error creating department:', e);
    } finally {
        await prisma.$disconnect();
    }
}

testCreate();
