import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSkillPersistence() {
    console.log('--- STARTING SKILL PERSISTENCE TEST ---');

    // 1. Get first job offer
    const job = await prisma.job_offer.findFirst();
    if (!job) {
        console.error('No job offer found to test!');
        return;
    }
    console.log(`Testing with Job ID: ${job.id}`);

    // 2. Define skills to save
    const skillsToSave = ['TestSkill1', 'TestSkill2', 'NodeJS'];
    console.log('Attempting to save skills:', skillsToSave);

    // 3. Update the job offer via Prisma (simulating what the service does)
    const updatedJob = await prisma.job_offer.update({
        where: { id: job.id },
        data: {
            required_skills: skillsToSave
        }
    });

    console.log('Update completed. Result from update call:', updatedJob.required_skills);

    // 4. Fetch it again to be super sure
    const fetchedJob = await prisma.job_offer.findUnique({
        where: { id: job.id }
    });

    console.log('Fetched job skills:', fetchedJob?.required_skills);

    if (JSON.stringify(fetchedJob?.required_skills) === JSON.stringify(skillsToSave)) {
        console.log('SUCCESS: Skills persisted correctly!');
    } else {
        console.error('FAILURE: Skills did NOT persist correctly.');
    }

    await prisma.$disconnect();
}

testSkillPersistence();
