
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testList() {
    const user = { id: 36, role: 'ROLE_ADMIN', company_id: 2 };

    const where = {
        is_active: true,
    };

    if (user.role !== 'ROLE_SUPER_ADMIN') {
        where.company_id = user.company_id;
    }

    console.log('Querying with where:', where);

    try {
        const departments = await prisma.department.findMany({
            where,
            take: 10,
        });

        console.log('Found departments:', departments.length);
        departments.forEach(d => console.log(d.id, d.name, d.company_id));
    } catch (e) {
        console.error('Error listing departments:', e);
    } finally {
        await prisma.$disconnect();
    }
}

testList();
