const { PrismaClient } = require('@prisma/client');

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
    let deptCount = 0;

    for (const dept of departments) {
        try {
            const department = await prisma.department.create({
                data: {
                    department_name: dept.name,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
            deptCount++;
            console.log(`  ✓ ${department.department_name}`);
        } catch (e) {
            console.log(`  ⚠ ${dept.name} (déjà existant)`);
        }
    }

    // ============================================
    // POSTES (20) - Indépendants des départements
    // ============================================

    const positions = [
        { title: 'Directeur Général', description: 'Responsable de la stratégie et direction de l\'entreprise', level: 'Executive' },
        { title: 'Directeur des Ressources Humaines', description: 'Gestion de la politique RH et du personnel', level: 'Executive' },
        { title: 'Directeur Informatique (CTO)', description: 'Responsable de la stratégie technique et IT', level: 'Executive' },
        { title: 'Directeur Juridique', description: 'Responsable des affaires juridiques', level: 'Executive' },
        { title: 'Directeur Financier (CFO)', description: 'Responsable de la gestion financière', level: 'Executive' },
        { title: 'Chef de Projet', description: 'Gestion et coordination de projets', level: 'Manager' },
        { title: 'Développeur Full Stack', description: 'Développement web frontend et backend', level: 'Technical' },
        { title: 'Développeur Frontend', description: 'Développement interfaces utilisateur', level: 'Technical' },
        { title: 'Développeur Backend', description: 'Développement API et services backend', level: 'Technical' },
        { title: 'DevOps Engineer', description: 'Infrastructure, CI/CD et automatisation', level: 'Technical' },
        { title: 'Data Scientist', description: 'Analyse de données et machine learning', level: 'Technical' },
        { title: 'Designer UX/UI', description: 'Conception d\'interfaces et expérience utilisateur', level: 'Technical' },
        { title: 'Responsable Marketing', description: 'Stratégie marketing et communication', level: 'Manager' },
        { title: 'Commercial', description: 'Vente et développement clientèle', level: 'Operational' },
        { title: 'Comptable', description: 'Gestion comptable et financière', level: 'Operational' },
        { title: 'Juriste', description: 'Conseil juridique et contrats', level: 'Operational' },
        { title: 'Chargé de Recrutement', description: 'Recrutement et gestion des talents', level: 'Operational' },
        { title: 'Responsable Qualité', description: 'Contrôle qualité et certifications', level: 'Manager' },
        { title: 'Technicien Support', description: 'Support technique et assistance utilisateurs', level: 'Operational' },
        { title: 'Analyste Business', description: 'Analyse des besoins et spécifications', level: 'Technical' },
    ];

    console.log('\n💼 Création des postes (indépendants des départements)...');
    let posCount = 0;

    for (const pos of positions) {
        try {
            const position = await prisma.position.create({
                data: {
                    title: pos.title,
                    description: pos.description,
                    level: pos.level,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
            posCount++;
            console.log(`  ✓ ${position.title} (${position.level})`);
        } catch (e) {
            console.log(`  ⚠ ${pos.title} (déjà existant ou erreur)`);
        }
    }

    // ============================================
    // RÉSUMÉ
    // ============================================

    console.log('\n📊 Résumé du seeding :');
    console.log(`  ✓ ${deptCount} départements créés`);
    console.log(`  ✓ ${posCount} postes créés (génériques, non liés aux départements)`);
    console.log('\n✅ Seeding terminé avec succès !');
    console.log('\n💡 Note : Les postes sont maintenant indépendants des départements.');
    console.log('   Le département est géré au niveau de l\'utilisateur.');
}

main()
    .catch((e) => {
        console.error('❌ Erreur lors du seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
