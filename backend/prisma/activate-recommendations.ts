
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAndApplyData() {
    const user = await prisma.user.findFirst({
        where: { username: 'Tshitsho' },
        include: { position: true }
    });

    if (!user) {
        console.log("Utilisateur Tshitsho non trouvé");
        return;
    }

    console.log("Position actuelle:", user.position?.title || "Aucune");

    // 1. Create a position if needed (ex: RH Manager)
    const pos = await prisma.position.upsert({
        where: { id: 2 },
        update: {},
        create: {
            id: 2,
            title: "Responsable Ressources Humaines",
            description: "Gestion des talents, paie et formation",
            created_at: new Date(),
            updated_at: new Date()
        }
    });

    // 2. Assign to user
    await prisma.user.update({
        where: { id: user.id },
        data: { position_id: pos.id }
    });

    // 3. Create a mandatory training to force visibility
    await prisma.training.upsert({
        where: { id: 999 },
        update: { is_mandatory: true },
        create: {
            id: 999,
            title: "Sécurité et Conformité RH",
            description: "Formation obligatoire sur les nouvelles normes RH 2024",
            category_id: 1, // Assumes category 1 exists
            level: 'BEGINNER',
            duration_hours: 2,
            is_mandatory: true,
            created_by_user_id: user.id,
            created_at: new Date(),
            updated_at: new Date()
        }
    });

    console.log("Configuration terminée. Actualisez la page pour voir les recommandations ✨");
}

checkAndApplyData()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
