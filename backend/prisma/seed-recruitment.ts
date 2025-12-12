import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRecruitment() {
    console.log('🚀 Seeding recruitment data...');

    // Create Job Offers
    const jobs = await Promise.all([
        prisma.job_offer.create({
            data: {
                title: 'Senior Full Stack Developer',
                description: 'Nous recherchons un développeur expérimenté pour rejoindre notre équipe core.',
                department: 'R&D',
                location: 'Paris, France',
                contract_type: 'CDI',
                status: 'PUBLISHED',
                posted_date: new Date('2024-12-10'),
            },
        }),
        prisma.job_offer.create({
            data: {
                title: 'Product Designer (UI/UX)',
                description: 'Créez les interfaces de demain pour nos outils RH.',
                department: 'Produit',
                location: 'Remote',
                contract_type: 'CDI',
                status: 'PUBLISHED',
                posted_date: new Date('2024-12-08'),
            },
        }),
        prisma.job_offer.create({
            data: {
                title: 'HR Manager',
                description: 'Gérez l\'onboarding et le suivi carrière des employés.',
                department: 'Ressources Humaines',
                location: 'Lyon, France',
                contract_type: 'CDD',
                status: 'DRAFT',
            },
        }),
    ]);

    console.log(`✅ Created ${jobs.length} job offers`);

    // Create Candidates
    const candidates = await Promise.all([
        prisma.candidate.create({
            data: {
                first_name: 'Jean',
                last_name: 'Dupont',
                email: 'jean.dupont@example.com',
                phone: '+33 6 12 34 56 78',
                skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
                rating: 4,
                is_in_talent_pool: false,
            },
        }),
        prisma.candidate.create({
            data: {
                first_name: 'Marie',
                last_name: 'Curie',
                email: 'marie.curie@example.com',
                phone: '+33 6 98 76 54 32',
                skills: ['Figma', 'Design System', 'UX Research'],
                rating: 5,
                is_in_talent_pool: false,
            },
        }),
        prisma.candidate.create({
            data: {
                first_name: 'Pierre',
                last_name: 'Martin',
                email: 'pierre.martin@example.com',
                phone: '+33 6 11 22 33 44',
                skills: ['React', 'Vue.js', 'Nest.js'],
                rating: 4,
                is_in_talent_pool: false,
            },
        }),
        prisma.candidate.create({
            data: {
                first_name: 'Sophie',
                last_name: 'Bernard',
                email: 'sophie.bernard@example.com',
                phone: '+33 6 55 66 77 88',
                skills: ['HR', 'Recrutement', 'Formation'],
                rating: 3,
                is_in_talent_pool: true,
            },
        }),
        prisma.candidate.create({
            data: {
                first_name: 'Luc',
                last_name: 'Moreau',
                email: 'luc.moreau@example.com',
                skills: ['Python', 'Machine Learning', 'Data Science'],
                rating: 5,
                is_in_talent_pool: true,
            },
        }),
    ]);

    console.log(`✅ Created ${candidates.length} candidates`);

    // Create Applications
    const applications = await Promise.all([
        prisma.candidate_application.create({
            data: {
                job_offer_id: jobs[0].id,
                candidate_id: candidates[0].id,
                stage: 'NEW',
                status: 'NEW',
            },
        }),
        prisma.candidate_application.create({
            data: {
                job_offer_id: jobs[0].id,
                candidate_id: candidates[2].id,
                stage: 'INTERVIEW',
                status: 'INTERVIEW',
            },
        }),
        prisma.candidate_application.create({
            data: {
                job_offer_id: jobs[1].id,
                candidate_id: candidates[1].id,
                stage: 'SCREENING',
                status: 'SCREENING',
            },
        }),
        prisma.candidate_application.create({
            data: {
                job_offer_id: jobs[2].id,
                candidate_id: candidates[3].id,
                stage: 'NEW',
                status: 'NEW',
            },
        }),
    ]);

    console.log(`✅ Created ${applications.length} applications`);

    // Get first user as interviewer
    const interviewer = await prisma.user.findFirst();

    if (interviewer) {
        // Create Interviews
        const interviews = await Promise.all([
            prisma.job_interview.create({
                data: {
                    application_id: applications[1].id,
                    candidate_id: candidates[2].id,
                    interviewer_id: interviewer.id,
                    interview_date: new Date('2024-12-14T10:00:00'),
                    type: 'VISIO',
                    status: 'SCHEDULED',
                },
            }),
        ]);

        console.log(`✅ Created ${interviews.length} interviews`);
    }

    console.log('🎉 Recruitment seed complete!');
}

seedRecruitment()
    .catch((e) => {
        console.error('Error seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
