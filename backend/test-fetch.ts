import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFetchJobs() {
    console.log('--- STARTING JOB FETCH TEST ---');

    const jobs = await prisma.job_offer.findMany({
        include: {
            applications: {
                include: { candidate: true }
            },
        },
        orderBy: { created_at: 'desc' },
        take: 5 // Just check the last 5
    });

    console.log(`Fetched ${jobs.length} jobs.`);

    for (const job of jobs) {
        console.log(`ID: ${job.id} | Title: ${job.title}`);
        console.log(`Status: ${job.status}`);
        console.log(`Required Skills (Raw DB Value):`, job.required_skills);
        console.log(`Type of Required Skills:`, typeof job.required_skills);
        console.log('---');
    }

    await prisma.$disconnect();
}

testFetchJobs();
