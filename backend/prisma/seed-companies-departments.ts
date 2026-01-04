import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding companies and departments...');

    const companyNames = [
        'TechGlobal Solutions',
        'GreenEarth Energy',
        'UrbanBuild Constructors',
        'MediCare Systems',
        'EduFuture Learning',
        'FinSecure Bank',
        'LogiTrans Logistics',
        'RetailPrime Stores',
        'AgriGrowth Farms',
        'AeroSpace Dynamics'
    ];

    const departmentsList = [
        { name: 'Ressources Humaines', description: 'Gestion du personnel et des talents' },
        { name: 'Technologies de l\'Information', description: 'Support technique et développement' },
        { name: 'Finance & Comptabilité', description: 'Gestion financière et audit' },
        { name: 'Marketing & Ventes', description: 'Promotion et commercialisation' }
    ];

    for (const companyName of companyNames) {
        // Check if company exists to avoid duplicates if run multiple times
        const existing = await prisma.company.findFirst({ where: { name: companyName } });

        let companyId;

        if (!existing) {
            const company = await prisma.company.create({
                data: {
                    name: companyName,
                    email: `contact@${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
                    currency: 'USD',
                    timezone: 'UTC',
                    language: 'fr',
                    is_active: true
                }
            });
            companyId = company.id;
            console.log(`Created company: ${company.name} (ID: ${company.id})`);
        } else {
            companyId = existing.id;
            console.log(`Company exists: ${existing.name} (ID: ${existing.id})`);
        }

        // Create departments for this company
        for (const deptData of departmentsList) {
            // Create department blindly or check unique? 
            // Departments don't have unique constraint on name per company in schema usually, but let's just create.
            await prisma.department.create({
                data: {
                    name: deptData.name,
                    description: deptData.description,
                    company_id: companyId,
                    is_active: true
                }
            });
            console.log(`  - Created department: ${deptData.name} for ${companyName}`);
        }
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
