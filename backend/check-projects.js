require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const projectCount = await prisma.project.count();
    const taskCount = await prisma.task.count();
    const assignmentCount = await prisma.task_assignment.count();
    const memberCount = await prisma.project_member.count();

    console.log('\n📊 Résumé FINAL :');
    console.log(`- ${projectCount} Projets`);
    console.log(`- ${taskCount} Tâches`);
    console.log(`- ${assignmentCount} Assignations de tâches`);
    console.log(`- ${memberCount} Membres de projets`);
}

main().finally(() => prisma.$disconnect());
