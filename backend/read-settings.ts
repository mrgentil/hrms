import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function readSettings() {
    console.log('📋 Lecture des paramètres de l\'application depuis la base de données\n');
    console.log('═'.repeat(80));

    const settings = await prisma.app_settings.findMany({
        orderBy: [
            { category: 'asc' },
            { key: 'asc' },
        ],
    });

    if (settings.length === 0) {
        console.log('❌ Aucun paramètre trouvé dans la table app_settings.');
    } else {
        console.log(`Total de paramètres trouvés : ${settings.length}\n`);

        // Grouper par catégorie
        const categories: Record<string, any[]> = {};
        settings.forEach(s => {
            const cat = s.category || 'general';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(s);
        });

        Object.entries(categories).forEach(([cat, items]) => {
            console.log(`\n📂 CATEGORIE: ${cat.toUpperCase()}`);
            console.log('─'.repeat(80));
            items.forEach(s => {
                console.log(`🔑 ${s.key.padEnd(20)} : ${s.value || '(null)'}`);
                if (s.label) console.log(`   Libellé : ${s.label}`);
                console.log('');
            });
        });
    }

    console.log('═'.repeat(80));
}

readSettings()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
