import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkJobOfferSkills() {
    const jobs = await prisma.job_offer.findMany({
        select: {
            id: true,
            title: true,
            required_skills: true,
            min_experience: true,
        },
    });

    console.log('=== JOB OFFERS IN DATABASE ===\n');

    for (const job of jobs) {
        console.log(`ID: ${job.id}`);
        console.log(`Title: ${job.title}`);
        console.log(`Required Skills Type: ${typeof job.required_skills}`);
        console.log(`Required Skills Value:`, job.required_skills);
        console.log(`Is Array: ${Array.isArray(job.required_skills)}`);
        console.log(`Min Experience: ${job.min_experience}`);
        console.log('---\n');
    }

    await prisma.$disconnect();
}

checkJobOfferSkills();
