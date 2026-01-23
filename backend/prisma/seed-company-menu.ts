
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addCompanyMenu() {
    console.log("Recherche du groupe 'Administration'...");

    // Trouver le menu "Administration"
    const adminMenu = await prisma.menu_item.findFirst({
        where: { name: 'Administration', parent_id: null }
    });

    if (!adminMenu) {
        console.error("Menu 'Administration' non trouvé !");
        return;
    }

    console.log(`Menu Administration trouvé (ID: ${adminMenu.id})`);

    // Trouver la permission 'system.settings'
    const settingsPermission = await prisma.permission.findUnique({
        where: { name: 'system.settings' }
    });

    if (!settingsPermission) {
        console.error("Permission 'system.settings' non trouvée !");
        return;
    }

    // Vérifier si le menu existe déjà
    const existingMenu = await prisma.menu_item.findFirst({
        where: { path: '/settings/company' }
    });

    if (existingMenu) {
        console.log("Le menu 'Configuration Entreprise' existe déjà.");

        // Mettre à jour avec la bonne permission si nécessaire
        await prisma.menu_item.update({
            where: { id: existingMenu.id },
            data: {
                parent_id: adminMenu.id,
                permission_id: settingsPermission.id,
                is_active: true
            }
        });
        console.log("Menu mis à jour.");
    } else {
        // Créer le menu
        await prisma.menu_item.create({
            data: {
                name: 'Configuration Entreprise',
                path: '/settings/company',
                icon: '🏢',
                section: 'advanced',
                sort_order: 2, // Juste après "Paramètres" (qui est souvent 1) ou avant
                parent_id: adminMenu.id,
                permission_id: settingsPermission.id,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            }
        });
        console.log("Menu 'Configuration Entreprise' créé avec succès.");
    }
}

addCompanyMenu()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
