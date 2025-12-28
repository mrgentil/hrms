
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listTables() {
    try {
        const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `;
        const tables = (result as any[]).map(row => Object.values(row)[0] as string);
        const targetTables = ['recognition', 'performance_review', 'feedback_360_request', 'perf_improvement_plan'];

        console.log('--- START CHECK ---');
        targetTables.forEach(t => {
            if (!tables.includes(t)) {
                console.log(`MISSING: ${t}`);
            } else {
                console.log(`FOUND: ${t}`);
            }
        });
        console.log('--- END CHECK ---');
    } catch (error) {
        console.error('Error listing tables:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listTables();
