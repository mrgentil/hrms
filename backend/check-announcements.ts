
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking available announcements...');

    const announcements = await prisma.department_announcement.findMany({
        include: {
            department: true,
            user: true
        }
    });

    console.log(`Found ${announcements.length} announcements.`);
    announcements.forEach(a => {
        console.log(`- [${a.id}] ${a.announcement_title} (Dept: ${a.department?.department_name || 'Global'}, By: ${a.user?.full_name})`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
