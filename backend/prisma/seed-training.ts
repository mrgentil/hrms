import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTraining() {
    console.log('🚀 Seeding training & development module...');

    // 1. Create Categories
    console.log('Creating Categories...');
    const catDev = await prisma.training_category.create({
        data: { name: 'Développement Web', description: 'Frontend, Backend, DevOps' }
    });
    const catSoft = await prisma.training_category.create({
        data: { name: 'Soft Skills', description: 'Communication, Leadership' }
    });
    const catSec = await prisma.training_category.create({
        data: { name: 'Sécurité', description: 'Cybersécurité et conformité' }
    });

    // 2. Create Trainings
    console.log('Creating Trainings...');
    const instructor = await prisma.user.findFirst(); // Assign first user as instructor creator ideally
    const creatorId = instructor?.id || 1;

    const t1 = await prisma.training.create({
        data: {
            title: 'Maîtriser NestJS',
            description: 'Formation complète sur le framework Node.js',
            category_id: catDev.id,
            level: 'ADVANCED',
            duration_hours: 20,
            is_online: true,
            created_by_user_id: creatorId,
            image_url: 'https://img.freepik.com/free-vector/programming-concept-illustration_114360-1351.jpg'
        }
    });

    const t2 = await prisma.training.create({
        data: {
            title: 'Leadership 101',
            description: 'Devenir un manager efficace',
            category_id: catSoft.id,
            level: 'BEGINNER',
            duration_hours: 8,
            is_online: false,
            created_by_user_id: creatorId,
            image_url: 'https://img.freepik.com/free-vector/business-team-discussing-ideas-startup_74855-4380.jpg'
        }
    });

    // 3. Create Sessions
    console.log('Creating Sessions...');
    const session1 = await prisma.training_session.create({
        data: {
            training_id: t1.id,
            start_date: new Date('2025-02-01'),
            end_date: new Date('2025-02-10'),
            location: 'Zoom',
            max_participants: 20
        }
    });

    const session2 = await prisma.training_session.create({
        data: {
            training_id: t2.id,
            start_date: new Date('2025-03-05'),
            end_date: new Date('2025-03-06'),
            location: 'Salle de réunion A',
            max_participants: 10
        }
    });

    // 4. Create Registrations (Subscriptions)
    console.log('Creating Registrations...');
    const users = await prisma.user.findMany({ take: 3 });

    if (users.length > 0) {
        // User 1 subscribes to NestJS (Approved)
        await prisma.training_registration.create({
            data: {
                user_id: users[0].id,
                training_id: t1.id,
                session_id: session1.id,
                status: 'APPROVED',
                notes: 'Besoin pour le projet X',
                approved_by_id: creatorId,
                approved_at: new Date()
            }
        });

        // User 2 subscribes to Leadership (Pending)
        if (users[1]) {
            await prisma.training_registration.create({
                data: {
                    user_id: users[1].id,
                    training_id: t2.id,
                    session_id: session2.id,
                    status: 'PENDING',
                    notes: 'Souhaite évoluer vers un poste de lead'
                }
            });
        }

        // User 3 (or 1) subscribes to NestJS (Completed)
        const user3 = users[2] || users[0];
        await prisma.training_registration.create({
            data: {
                user_id: user3.id,
                training_id: t1.id,
                session_id: session1.id,
                status: 'COMPLETED',
                score: 95,
                completed_at: new Date(),
                feedback: 'Excellente formation !'
            }
        });
    }

    // 5. Certifications
    console.log('Creating Certifications...');
    const cert = await prisma.certification.create({
        data: {
            name: 'Développeur Backend Certifié',
            issuing_org: 'Tech Academy',
            validity_months: 24,
            description: 'Certification validant les compétences backend avancées.'
        }
    });

    // Assign Certification to User 1
    if (users[0]) {
        await prisma.user_certification.create({
            data: {
                user_id: users[0].id,
                certification_id: cert.id,
                obtained_date: new Date(),
                expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
                credential_id: 'CERT-2025-001'
            }
        });
    }

    // 6. E-Learning
    console.log('Creating E-Learning...');
    await prisma.elearning_module.create({
        data: {
            title: 'Introduction à React',
            description: 'Les bases de React pour les développeurs Angular',
            category_id: catDev.id,
            duration_minutes: 120,
            content_url: 'https://www.youtube.com/watch?v=SqcY0GlETPk', // Example URL
            thumbnail_url: 'https://img.freepik.com/free-vector/web-development-programmer-engineering-coding-website-augmented-reality-interface-screens-developer-project-engineer-programming-software-application-design-cartoon-illustration_107791-3863.jpg'
        }
    });

    console.log('🎉 Training seed complete!');
}

seedTraining()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
