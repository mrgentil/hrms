import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const menus = await prisma.menu_item.findMany({
    where: { parent_id: null },
    orderBy: [{ section: 'asc' }, { sort_order: 'asc' }],
    include: {
      permission: { select: { name: true } },
      children: {
        orderBy: { sort_order: 'asc' },
        include: { permission: { select: { name: true } } },
      },
    },
  });

  console.log('\n=== MENUS CONFIGURÉS ===\n');

  const sections: Record<string, typeof menus> = {};
  menus.forEach((m) => {
    const sec = m.section || 'main';
    if (!sections[sec]) sections[sec] = [];
    sections[sec].push(m);
  });

  const sectionLabels: Record<string, string> = {
    main: '📋 MENU PRINCIPAL',
    advanced: '⚙️ MODULES AVANCÉS',
    hrms: '🏢 MODULES HRMS',
    employee: '👤 ESPACE EMPLOYÉ',
  };

  for (const [sec, items] of Object.entries(sections)) {
    console.log(`\n${sectionLabels[sec] || sec.toUpperCase()}`);
    console.log('─'.repeat(50));

    items.forEach((menu) => {
      const perm = menu.permission?.name || '(aucune)';
      const status = menu.is_active ? '✅' : '❌';
      console.log(`${status} ${menu.icon || '📄'} ${menu.name}`);
      console.log(`   Path: ${menu.path || '(parent)'} | Permission: ${perm}`);

      if (menu.children && menu.children.length > 0) {
        menu.children.forEach((child: any) => {
          const childPerm = child.permission?.name || '(aucune)';
          const childStatus = child.is_active ? '✅' : '❌';
          console.log(`   ${childStatus} └─ ${child.icon || '📄'} ${child.name}`);
          console.log(`      Path: ${child.path} | Permission: ${childPerm}`);
        });
      }
    });
  }

  console.log('\n=== FIN ===\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
