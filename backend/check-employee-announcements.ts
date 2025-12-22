import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    console.log('=== Check Employee Announcements Access ===\n');

    // Get employees
    const employees = await prisma.user.findMany({
        where: { role: 'ROLE_EMPLOYEE' },
        select: { id: true, full_name: true, department_id: true, active: true },
        take: 5,
    });

    console.log('Employees found:', employees.length);
    employees.forEach((e) => {
        console.log(`  - [${e.id}] ${e.full_name} | dept: ${e.department_id} | active: ${e.active}`);
    });

    // Get all announcements
    const announcements = await prisma.announcement.findMany({
        where: { is_published: true },
        select: {
            id: true,
            title: true,
            target_all: true,
            department_id: true,
            expire_date: true,
        },
    });

    console.log('\nPublished announcements:', announcements.length);
    announcements.forEach((a) => {
        const expired = a.expire_date && new Date(a.expire_date) < new Date();
        console.log(`  - [${a.id}] "${a.title}" | target_all: ${a.target_all} | dept: ${a.department_id || 'ALL'} | expired: ${expired}`);
    });

    // Test what an employee would see
    if (employees.length > 0) {
        const testEmployee = employees[0];
        console.log(`\nTesting announcements for employee: ${testEmployee.full_name} (dept: ${testEmployee.department_id})`);

        const now = new Date();
        const visibleAnnouncements = await prisma.announcement.findMany({
            where: {
                is_published: true,
                OR: [
                    { expire_date: null },
                    { expire_date: { gte: now } },
                ],
                AND: [
                    {
                        OR: [
                            { target_all: true },
                            { department_id: testEmployee.department_id || 0 },
                        ],
                    },
                ],
            },
        });

        console.log(`Visible announcements for this employee: ${visibleAnnouncements.length}`);
        visibleAnnouncements.forEach((a) => {
            console.log(`  - [${a.id}] "${a.title}"`);
        });
    }
}

check()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
