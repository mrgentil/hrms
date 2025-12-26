
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function listMenus() {
    const menus = await prisma.menu_item.findMany({
        include: {
            permission: true,
            children: true
        },
        orderBy: { sort_order: 'asc' }
    });

    let output = "=== ALL MENU ITEMS ===\n";
    menus.forEach(m => {
        if (!m.parent_id) {
            output += `[ID:${m.id}] ${m.name} | Section: ${m.section} | Permission: ${m.permission?.name || 'NONE'}\n`;
            m.children?.forEach(c => {
                output += `   └─ [ID:${c.id}] ${c.name} | Path: ${c.path} | Permission: ${c.permission_id ? 'SET' : 'NONE'}\n`;
            });
        }
    });

    fs.writeFileSync('menus_list.txt', output);
    console.log("Output written to menus_list.txt");
}

listMenus()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
