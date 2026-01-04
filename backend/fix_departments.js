const { PrismaClient } = require('@prisma/client');

async function fix(url) {
    console.log('Connecting to:', url);
    const prisma = new PrismaClient({ datasources: { db: { url } } });
    try {
        const unnamed = await prisma.department.findMany({
            where: {
                OR: [{ name: '' }, { name: null }]
            }
        });
        console.log(`Found ${unnamed.length} unnamed departments.`);

        for (const dep of unnamed) {
            const newName = `Département ${dep.id}`;
            // Check if name already exists (unlikely for "Department ID" but good practice)
            // Actually, IDs are unique so name uniqueness shouldn't be an issue if we include ID.
            await prisma.department.update({
                where: { id: dep.id },
                data: { name: newName }
            });
            console.log(`Renamed ID ${dep.id} to "${newName}"`);
        }
        return true;
    } catch (e) {
        console.error('Error:', e.message.split('\n')[0]);
        return false;
    } finally {
        await prisma.$disconnect();
    }
}

async function main() {
    // Try likely URLs
    if (await fix('mysql://root:@localhost:3306/hrms')) return;
    if (await fix('mysql://root:root@localhost:3306/hrms')) return;
    if (await fix('mysql://root:@127.0.0.1:3306/hrms')) return;
}

main();
