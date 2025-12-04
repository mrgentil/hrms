import { PrismaClient, attendance_status, expense_report_category, expense_report_status } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Ajout des données de démonstration...\n');

  // Récupérer les utilisateurs existants
  const users = await prisma.user.findMany({
    where: { active: true },
    take: 10,
  });

  if (users.length === 0) {
    console.log('❌ Aucun utilisateur trouvé. Créez d\'abord des utilisateurs.');
    return;
  }

  console.log(`✓ ${users.length} utilisateurs trouvés\n`);

  // ============================================
  // DONNÉES DE PRÉSENCE (30 derniers jours)
  // ============================================
  console.log('📊 Création des données de présence...');
  
  const today = new Date();
  const attendanceData: Array<{
    user_id: number;
    date: Date;
    check_in: Date;
    check_out: Date;
    status: attendance_status;
    worked_hours: number;
    notes: string | null;
  }> = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // Pour chaque utilisateur, créer une présence (avec probabilité)
    for (const user of users) {
      // 85% de chance d'être présent
      if (Math.random() > 0.15) {
        const checkIn = new Date(date);
        checkIn.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0);
        
        const checkOut = new Date(date);
        checkOut.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0);

        attendanceData.push({
          user_id: user.id,
          date: date,
          check_in: checkIn,
          check_out: checkOut,
          status: attendance_status.PRESENT,
          worked_hours: 8 + Math.random() * 2,
          notes: null,
        });
      }
    }
  }

  // Supprimer les anciennes données de présence pour éviter les doublons
  await prisma.attendance.deleteMany({
    where: {
      date: {
        gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  });

  // Insérer les nouvelles données
  for (const data of attendanceData) {
    await prisma.attendance.create({ data });
  }

  console.log(`✓ ${attendanceData.length} enregistrements de présence créés\n`);

  // ============================================
  // DONNÉES DE DÉPENSES (6 derniers mois)
  // ============================================
  console.log('💰 Création des données de dépenses...');

  const categories: expense_report_category[] = [
    expense_report_category.TRANSPORT,
    expense_report_category.MEALS,
    expense_report_category.ACCOMMODATION,
    expense_report_category.EQUIPMENT,
    expense_report_category.TRAINING,
    expense_report_category.OTHER,
  ];
  const statuses: expense_report_status[] = [
    expense_report_status.PENDING,
    expense_report_status.APPROVED,
    expense_report_status.REJECTED,
    expense_report_status.PAID,
  ];
  const expenseReportData: Array<{
    user_id: number;
    title: string;
    description: string;
    amount: number;
    category: expense_report_category;
    status: expense_report_status;
    expense_date: Date;
    receipt_url: string | null;
    approved_by: number | null;
    approved_at: Date | null;
    created_at: Date;
    updated_at: Date;
  }> = [];

  for (let month = 0; month < 6; month++) {
    const monthDate = new Date(today);
    monthDate.setMonth(monthDate.getMonth() - month);

    // 5-15 notes de frais par mois
    const numExpenses = 5 + Math.floor(Math.random() * 10);

    for (let j = 0; j < numExpenses; j++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const expenseDate = new Date(monthDate);
      expenseDate.setDate(1 + Math.floor(Math.random() * 28));

      const amount = 50 + Math.floor(Math.random() * 500);

      expenseReportData.push({
        user_id: user.id,
        title: `${category.toLowerCase()} - ${expenseDate.toLocaleDateString('fr-FR')}`,
        description: `Note de frais pour ${category.toLowerCase()}`,
        amount: amount,
        category: category,
        status: status,
        expense_date: expenseDate,
        receipt_url: null,
        approved_by: status === 'APPROVED' || status === 'PAID' ? users[0].id : null,
        approved_at: status === 'APPROVED' || status === 'PAID' ? new Date() : null,
        created_at: expenseDate,
        updated_at: new Date(),
      });
    }
  }

  // Supprimer les anciennes données
  await prisma.expense_report.deleteMany({});

  // Insérer les nouvelles données
  for (const data of expenseReportData) {
    await prisma.expense_report.create({ data });
  }

  console.log(`✓ ${expenseReportData.length} notes de frais créées\n`);

  // ============================================
  // RÉSUMÉ
  // ============================================
  const attendanceCount = await prisma.attendance.count();
  const expenseCount = await prisma.expense_report.count();

  console.log('═══════════════════════════════════════');
  console.log('📊 RÉSUMÉ DES DONNÉES');
  console.log('═══════════════════════════════════════');
  console.log(`   Présences:     ${attendanceCount} enregistrements`);
  console.log(`   Notes de frais: ${expenseCount} enregistrements`);
  console.log('═══════════════════════════════════════\n');
  console.log('✅ Données de démonstration créées avec succès !');
  console.log('🔄 Rafraîchissez le dashboard pour voir les graphiques.');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
