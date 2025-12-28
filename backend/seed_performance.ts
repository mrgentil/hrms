
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seeding for Performance Module...');

    // 1. Get Admin User (Creator)
    const admin = await prisma.user.findFirst({
        where: { role: 'ROLE_ADMIN' }, // Adjust if needed
    });

    if (!admin) {
        console.error('❌ No Admin user found. Please create one first.');
        return;
    }
    const creatorId = admin.id;

    // 2. Create Campaigns (Past, Present, Future)
    const campaignsData = [
        { title: 'Évaluation Annuelle 2023', year: 2023, status: 'CLOSED', start: '2023-01-01', end: '2023-12-31' },
        { title: 'Performance Q1 2024', year: 2024, status: 'CLOSED', start: '2024-01-01', end: '2024-03-31' },
        { title: 'Performance Q2 2024', year: 2024, status: 'CLOSED', start: '2024-04-01', end: '2024-06-30' },
        { title: 'Évaluation Mi-Année 2024', year: 2024, status: 'CLOSED', start: '2024-06-01', end: '2024-07-31' },
        { title: 'Performance Q3 2024', year: 2024, status: 'CLOSED', start: '2024-07-01', end: '2024-09-30' },
        { title: 'Campagne Annuelle 2025', year: 2025, status: 'ACTIVE', start: '2025-01-01', end: '2025-12-31' }, // CURRENT
        { title: 'Objectifs Q1 2025', year: 2025, status: 'DRAFT', start: '2025-01-01', end: '2025-03-31' },
        { title: 'Objectifs Q2 2025', year: 2025, status: 'DRAFT', start: '2025-04-01', end: '2025-06-30' },
        { title: 'Campagne Future 2026', year: 2026, status: 'DRAFT', start: '2026-01-01', end: '2026-12-31' },
    ];

    for (const cam of campaignsData) {
        const exists = await prisma.performance_campaign.findFirst({ where: { title: cam.title } });
        if (!exists) {
            await prisma.performance_campaign.create({
                data: {
                    title: cam.title,
                    description: `Campagne de performance pour ${cam.title}`,
                    type: 'ANNUAL',
                    year: cam.year,
                    status: cam.status as any,
                    start_date: new Date(cam.start),
                    end_date: new Date(cam.end),
                    created_by_id: creatorId,
                },
            });
            console.log(`✅ Created Campaign: ${cam.title}`);
        }
    }

    // 3. Create Company Objectives (Strategic Context)
    console.log('🏢 Creating Company Objectives...');
    const companyObjectives = [
        { title: 'Atteindre 10M€ de CA', category: 'Finance', type: 'COMPANY' },
        { title: 'Expansion Internationale (USA)', category: 'Croissance', type: 'COMPANY' },
        { title: 'Satisfaction Client > 90%', category: 'Qualité', type: 'COMPANY' },
        { title: 'Devenir Leader RSE', category: 'RSE', type: 'COMPANY' },
        { title: 'Innovation Produit V2', category: 'Produit', type: 'COMPANY' },
    ];

    for (const obj of companyObjectives) {
        const exists = await prisma.performance_objective.findFirst({ where: { title: obj.title } });
        if (!exists) {
            await prisma.performance_objective.create({
                data: {
                    employee_id: creatorId, // Assigned to Admin as placeholder owner
                    title: obj.title,
                    description: 'Objectif stratégique global pour toute l\'entreprise.',
                    type: 'COMPANY',
                    category: obj.category,
                    metric_type: 'PERCENTAGE',
                    target_value: 100,
                    weight: 0, // Reference only
                    start_date: new Date('2025-01-01'),
                    due_date: new Date('2025-12-31'),
                    status: 'IN_PROGRESS'
                }
            });
            console.log(`✅ Created Company Objective: ${obj.title}`);
        }
    }

    // 4. Create Team Objectives (for Admin or Random Managers)
    // Need to find some managers first? Assuming Admin is a manager for demo.
    console.log('👥 Creating Team Objectives...');
    const teamObjectives = [
        { title: 'Livrer le module RH', category: 'Dev', type: 'TEAM' },
        { title: 'Recruter 5 développeurs', category: 'RH', type: 'TEAM' },
        { title: 'Optimiser le CI/CD', category: 'DevOps', type: 'TEAM' },
    ];

    for (const obj of teamObjectives) {
        const exists = await prisma.performance_objective.findFirst({ where: { title: obj.title } });
        if (!exists) {
            await prisma.performance_objective.create({
                data: {
                    employee_id: creatorId, // Assigned to Admin 
                    title: obj.title,
                    description: 'Objectif partagé par l\'équipe.',
                    type: 'TEAM',
                    category: obj.category,
                    metric_type: 'PERCENTAGE',
                    target_value: 100,
                    weight: 0,
                    start_date: new Date('2025-01-01'),
                    due_date: new Date('2025-06-30'),
                    status: 'IN_PROGRESS'
                }
            });
            console.log(`✅ Created Team Objective: ${obj.title}`);
        }
    }

    console.log('🏁 Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
