import { PrismaClient, attendance_status } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ 
    where: { active: true }, 
    take: 4 
  });
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  console.log('📅 Date aujourd\'hui:', today.toISOString());
  
  for (const user of users) {
    const checkIn = new Date(today);
    checkIn.setHours(8, 30, 0);
    
    try {
      await prisma.attendance.create({
        data: {
          user_id: user.id,
          date: today,
          check_in: checkIn,
          status: attendance_status.PRESENT,
        }
      });
      console.log(`✓ Présence ajoutée pour ${user.full_name}`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        console.log(`- ${user.full_name} a déjà une présence aujourd'hui`);
      } else {
        throw e;
      }
    }
  }
  
  const count = await prisma.attendance.count({
    where: {
      date: { gte: today, lte: new Date(today.getTime() + 24*60*60*1000) }
    }
  });
  
  console.log(`\n✅ Total présences aujourd'hui: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
