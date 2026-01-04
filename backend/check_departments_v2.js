const { PrismaClient } = require('@prisma/client');

async function check(url) {
    console.log('Trying URL:', url);
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: url,
            },
        },
    });
    try {
        const departments = await prisma.department.findMany({
            select: {
                id: true,
                name: true,
                company_id: true,
                _count: {
                    select: { users: true }
                }
            }
        });
        console.log('Success with URL:', url);
        console.log('Departments:', JSON.stringify(departments, null, 2));
        return true;
    } catch (e) {
        console.log('Failed with URL:', url, e.message.split('\n')[0]);
        return false;
    } finally {
        await prisma.$disconnect();
    }
}

async function main() {
    // Try common Laragon defaults
    if (await check('mysql://root:@localhost:3306/hrms')) return;
    if (await check('mysql://root:root@localhost:3306/hrms')) return;
    if (await check('mysql://root:@127.0.0.1:3306/hrms')) return;
}

main();
