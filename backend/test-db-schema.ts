import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSchema() {
  try {
    // Test department table
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
      }
    });
    console.log('Department query successful:', departments.length, 'departments found');
    
    // Test user with department relation
    const users = await prisma.user.findMany({
      select: {
        id: true,
        full_name: true,
        department: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      take: 5
    });
    console.log('User query successful:', users.length, 'users found');
    
  } catch (error) {
    console.error('Database schema error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSchema();
