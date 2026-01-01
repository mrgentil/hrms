import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Début du seeding...');

    // ============================================
    // DÉPARTEMENTS (20)
    // ============================================

    const departments = [
        { name: 'Direction Générale', description: 'Direction et stratégie de l\'entreprise' },
        { name: 'Ressources Humaines', description: 'Gestion du personnel et recrutement' },
        { name: 'Informatique', description: 'Développement et infrastructure IT' },
        { name: 'Juridique', description: 'Affaires juridiques et conformité' },
        { name: 'Finance et Comptabilité', description: 'Gestion financière et comptable' },
        { name: 'Commercial et Ventes', description: 'Développement commercial et ventes' },
        { name: 'Marketing', description: 'Marketing et communication' },
        { name: 'Production', description: 'Fabrication et production' },
        { name: 'Logistique', description: 'Gestion des stocks et livraisons' },
        { name: 'Qualité', description: 'Contrôle qualité et amélioration continue' },
        { name: 'Recherche et Développement', description: 'Innovation et développement produits' },
        { name: 'Service Client', description: 'Support et satisfaction client' },
        { name: 'Achats', description: 'Approvisionnement et négociations fournisseurs' },
        { name: 'Communication', description: 'Communication interne et externe' },
        { name: 'Sécurité et Environnement', description: 'HSE et normes environnementales' },
        { name: 'Formation', description: 'Formation et développement des compétences' },
        { name: 'Maintenance', description: 'Maintenance des équipements et infrastructures' },
        { name: 'Administration', description: 'Services administratifs généraux' },
        { name: 'Innovation Digitale', description: 'Transformation digitale et innovation' },
        { name: 'Relations Publiques', description: 'Relations presse et événementiel' },
    ];

    console.log('📦 Création des départements...');
    const createdDepartments: any[] = [];

    for (const dept of departments) {
        // Manually check for existence as there is no unique constraint on name
        const existing = await prisma.department.findFirst({
            where: { name: dept.name }
        });

        let department;
        if (existing) {
            department = await prisma.department.update({
                where: { id: existing.id },
                data: {
                    name: dept.name,
                    updated_at: new Date(),
                }
            });
        } else {
            department = await prisma.department.create({
                data: {
                    name: dept.name,
                    created_at: new Date(),
                    updated_at: new Date(),
                }
            });
        }
        createdDepartments.push(department);
        console.log(`  ✓ ${department.name}`);
    }

    // ============================================
    // POSTES (20)
    // ============================================

    const positions = [
        { title: 'Directeur Général', description: 'Responsable de la stratégie', level: 'Executive' },
        { title: 'Directeur des Ressources Humaines', description: 'Gestion RH', level: 'Executive' },
        { title: 'Directeur Informatique (CTO)', description: 'Stratégie IT', level: 'Executive' },
        { title: 'Directeur Juridique', description: 'Affaires juridiques', level: 'Executive' },
        { title: 'Directeur Financier (CFO)', description: 'Gestion financière', level: 'Executive' },
        { title: 'Chef de Projet', description: 'Gestion projets', level: 'Manager' },
        { title: 'Développeur Full Stack', description: 'Dev Web', level: 'Technical' },
        { title: 'Développeur Frontend', description: 'UI/UX Dev', level: 'Technical' },
        { title: 'Développeur Backend', description: 'API Dev', level: 'Technical' },
        { title: 'DevOps Engineer', description: 'Infrastructure', level: 'Technical' },
        { title: 'Data Scientist', description: 'Data', level: 'Technical' },
        { title: 'Designer UX/UI', description: 'Design', level: 'Technical' },
        { title: 'Responsable Marketing', description: 'Marketing', level: 'Manager' },
        { title: 'Commercial', description: 'Ventes', level: 'Operational' },
        { title: 'Comptable', description: 'Compta', level: 'Operational' },
        { title: 'Juriste', description: 'Conseil', level: 'Operational' },
        { title: 'Chargé de Recrutement', description: 'Recrutement', level: 'Operational' },
        { title: 'Responsable Qualité', description: 'Qualité', level: 'Manager' },
        { title: 'Technicien Support', description: 'Support', level: 'Operational' },
        { title: 'Analyste Business', description: 'Specs', level: 'Technical' },
    ];

    console.log('\n💼 Création des postes...');
    const createdPositions: any[] = [];

    for (const pos of positions) {
        // Manually check for existing position by title
        const existing = await prisma.position.findFirst({
            where: { title: pos.title }
        });

        let position;
        if (existing) {
            position = await prisma.position.update({
                where: { id: existing.id },
                data: {
                    title: pos.title,
                    description: pos.description,
                    level: pos.level,
                    updated_at: new Date(),
                }
            });
        } else {
            position = await prisma.position.create({
                data: {
                    title: pos.title,
                    description: pos.description,
                    level: pos.level,
                    created_at: new Date(),
                    updated_at: new Date(),
                }
            });
        }
        createdPositions.push(position);
        console.log(`  ✓ ${position.title} (${position.level})`);
    }

    // ============================================
    // RÉSUMÉ
    // ============================================

    console.log('\n📊 Résumé du seeding :');
    console.log(`  ✓ ${createdDepartments.length} départements créés/vérifiés`);
    console.log(`  ✓ ${createdPositions.length} postes créés/vérifiés`);
    console.log('\n✅ Seeding terminé avec succès !');
}

main()
    .catch((e) => {
        console.error('❌ Erreur lors du seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
