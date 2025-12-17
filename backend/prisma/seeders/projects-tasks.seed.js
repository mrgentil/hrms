require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Début du seeding PROJETS et TÂCHES...');

    // 1. Récupérer les utilisateurs
    const users = await prisma.user.findMany();

    if (users.length === 0) {
        console.error('❌ Aucun utilisateur trouvé. Lancez users.seed.js d\'abord.');
        return;
    }

    // Filtrer les managers/admins pour être propriétaires de projets
    // On utilise une approche souple car on ne connait pas les IDs exacts
    const managers = users.filter(u =>
        u.role_id <= 5 || // IDs probables
        ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_SUPER_ADMIN', 'ROLE_RH'].includes(u.role) // Vérification via enum
    );

    const projectOwners = managers.length > 0 ? managers : users; // Fallback

    console.log(`✓ ${users.length} utilisateurs disponibles`);
    console.log(`✓ ${projectOwners.length} owners potentiels`);

    // ============================================
    // DONNÉES DE GÉNÉRATION
    // ============================================

    const projectNames = [
        'Refonte Site Web Corporatif', 'Migration Cloud AWS', 'Application Mobile iOS', 'Dashboard Analytique',
        'Campagne Marketing Été', 'Audit Sécurité 2025', 'Système de Paie V2', 'Intégration CRM Salesforce',
        'Formation Nouveaux Arrivants', 'Conformité GDPR', 'Plateforme E-learning', 'Automatisation Service Client',
        'Refonte Identité Visuelle', 'Optimisation Base de Données', 'API Gateway Microservices', 'Sondage Satisfaction',
        'Reporting Financier Q1', 'Maintenance Serveurs', 'Migration Email 365', 'Hackathon Interne'
    ];

    const taskTitles = [
        'Analyser les besoins', 'Créer les maquettes UX/UI', 'Développer API Backend', 'Intégrer Frontend',
        'Configurer CI/CD', 'Tests unitaires', 'Tests E2E', 'Rédaction documentation', 'Réunion de lancement',
        'Revue de code', 'Correction bugs', 'Optimisation performance', 'Déploiement production', 'Formation utilisateurs',
        'Configuration base de données', 'Design architecture', 'Analyse concurrentielle', 'Préparation budget',
        'Recrutement équipe', 'Validation juridique'
    ];

    const columnNames = ['À faire', 'En cours', 'En revue', 'Terminé'];

    // ============================================
    // CRÉATION DES PROJETS
    // ============================================

    console.log('\n🏗️  Création de 20 projets...');

    for (let i = 0; i < 20; i++) {
        const owner = projectOwners[Math.floor(Math.random() * projectOwners.length)];
        const projectName = projectNames[i] || `Projet ${i + 1}`;

        // Status aléatoire (enum project_status: PLANNED, IN_PROGRESS, COMPLETED, ON_HOLD, ARCHIVED)
        const statuses = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        try {
            // Création Projet
            const project = await prisma.project.create({
                data: {
                    name: projectName,
                    description: `Description détaillée pour le projet ${projectName}. Ce projet est stratégique pour l'entreprise.`,
                    status: status,
                    start_date: new Date(),
                    end_date: new Date(new Date().setMonth(new Date().getMonth() + 3)),
                    owner_user_id: owner.id,
                    created_at: new Date(),
                    updated_at: new Date(),
                }
            });

            console.log(`  📂 Projet créé: ${project.name} (Owner: ${owner.full_name})`);

            // Ajouter des membres au projet (3 à 8 membres aléatoires)
            const memberCount = Math.floor(Math.random() * 6) + 3;
            const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
            const members = shuffledUsers.slice(0, memberCount);

            // Toujours inclure l'owner
            if (!members.find(m => m.id === owner.id)) {
                members.push(owner);
            }

            for (const member of members) {
                // Attention aux duplicatas
                await prisma.project_member.upsert({
                    where: {
                        user_id_project_id: {
                            user_id: member.id,
                            project_id: project.id
                        }
                    },
                    update: {},
                    create: {
                        project_id: project.id,
                        user_id: member.id,
                        role: member.id === owner.id ? 'Owner' : 'Member',
                        created_at: new Date(),
                        updated_at: new Date(),
                    }
                });
            }

            // Créer Task Board
            const board = await prisma.task_board.create({
                data: {
                    name: 'Tableau Principal',
                    project_id: project.id,
                    created_at: new Date(),
                    updated_at: new Date(),
                }
            });

            // Créer Colonnes
            const columns = [];
            for (let j = 0; j < columnNames.length; j++) {
                const col = await prisma.task_column.create({
                    data: {
                        name: columnNames[j],
                        sort_order: j,
                        task_board_id: board.id,
                        created_at: new Date(),
                        updated_at: new Date(),
                    }
                });
                columns.push(col);
            }

            // ============================================
            // CRÉATION DES TÂCHES (5 à 12 par projet)
            // ============================================
            const taskCount = Math.floor(Math.random() * 8) + 5;

            for (let k = 0; k < taskCount; k++) {
                const title = taskTitles[Math.floor(Math.random() * taskTitles.length)];
                const assignee = members[Math.floor(Math.random() * members.length)];
                const column = columns[Math.floor(Math.random() * columns.length)];

                // Determine status based on column
                let taskStatus = 'TODO';
                if (column.name === 'En cours') taskStatus = 'IN_PROGRESS';
                if (column.name === 'En revue') taskStatus = 'IN_PROGRESS'; // Correction ici
                if (column.name === 'Terminé') taskStatus = 'DONE';

                const task = await prisma.task.create({
                    data: {
                        title: `${title} - ${project.name.split(' ')[0]}`,
                        description: `Il faut réaliser la tâche ${title} avec soin.`,
                        status: taskStatus,
                        priority: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)], // URGENT supprimé au cas où
                        start_date: new Date(),
                        due_date: new Date(new Date().setDate(new Date().getDate() + 7)),
                        task_column_id: column.id,
                        project_id: project.id,
                        created_by_user_id: owner.id,
                        created_at: new Date(),
                        updated_at: new Date(),
                    }
                });

                // Assigner la tâche
                await prisma.task_assignment.create({
                    data: {
                        task_id: task.id,
                        user_id: assignee.id,
                        assigned_at: new Date(),
                        created_at: new Date(),
                        updated_at: new Date(),
                        role: 'Assignee'
                    }
                });
            }
            console.log(`    ✅ ${taskCount} tâches ajoutées`);

        } catch (err) {
            console.error(`  ❌ Erreur sur le projet ${projectName}:`, err.message);
        }
    }

    console.log('\n✅ Seeding Projets & Tâches terminé !');
}

main()
    .catch((e) => {
        console.error('❌ Erreur Fatale:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
