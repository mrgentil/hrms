import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listMenus() {
  console.log('📋 Liste de tous les menus dans la base de données\n');
  console.log('═'.repeat(80));

  const menus = await prisma.menu_item.findMany({
    orderBy: [
      { section: 'asc' },
      { sort_order: 'asc' },
    ],
    include: {
      permission: {
        select: {
          name: true,
          label: true,
        },
      },
      parent: {
        select: {
          name: true,
        },
      },
    },
  });

  console.log(`Total de menus trouvés : ${menus.length}\n`);

  // Grouper par section
  const sections: Record<string, any[]> = {};
  menus.forEach(menu => {
    const section = menu.section || 'unknown';
    if (!sections[section]) sections[section] = [];
    sections[section].push(menu);
  });

  // Afficher par section
  Object.entries(sections).forEach(([section, items]) => {
    console.log(`\n📂 SECTION: ${section.toUpperCase()}`);
    console.log('─'.repeat(80));

    items.forEach(menu => {
      const indent = menu.parent_id ? '   └─ ' : '├─ ';
      const icon = menu.icon || '•';
      const permission = menu.permission?.name || 'Aucune permission';
      const active = menu.is_active ? '✓' : '✗';

      console.log(`${active} ${indent}${icon} ${menu.name}`);
      console.log(`      Path: ${menu.path || 'N/A'}`);
      console.log(`      Permission: ${permission}`);
      console.log(`      ID: ${menu.id}, Parent: ${menu.parent_id || 'N/A'}`);
      console.log('');
    });
  });

  console.log('═'.repeat(80));

  // Statistiques
  const stats = {
    total: menus.length,
    active: menus.filter(m => m.is_active).length,
    withPermission: menus.filter(m => m.permission_id).length,
    parents: menus.filter(m => !m.parent_id).length,
    children: menus.filter(m => m.parent_id).length,
  };

  console.log('\n📊 STATISTIQUES:');
  console.log(`   Total de menus: ${stats.total}`);
  console.log(`   Menus actifs: ${stats.active}`);
  console.log(`   Avec permission: ${stats.withPermission}`);
  console.log(`   Menus parents: ${stats.parents}`);
  console.log(`   Sous-menus: ${stats.children}`);
  console.log('');
}

listMenus()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
