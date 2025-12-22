import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fix() {
    console.log('=== Fix announcements target_all ===\n');

    // Update announcements without department to have target_all = true
    const result = await prisma.announcement.updateMany({
        where: {
            department_id: null,
            target_all: false,
        },
        data: {
            target_all: true,
        },
    });

    console.log(`✅ Updated ${result.count} announcements to target_all=true\n`);

    // Show all announcements
    const all = await prisma.announcement.findMany({
        select: {
            id: true,
            title: true,
            is_published: true,
            target_all: true,
            department_id: true,
        },
    });

    console.log('All announcements:');
    all.forEach((a) => {
        console.log(`  - [${a.id}] "${a.title}" | published: ${a.is_published} | target_all: ${a.target_all} | dept: ${a.department_id || 'ALL'}`);
    });
}

fix()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
