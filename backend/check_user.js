
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    try {
        const user = await prisma.user.findUnique({
            where: { id: 36 },
            include: {
                company: true,
                role_relation: true
            }
        });

        console.log('--- User 36 Info ---');
        if (user) {
            console.log('ID:', user.id);
            console.log('Username:', user.username);
            console.log('Work Email:', user.work_email);
            console.log('Role:', user.role);
            console.log('Company ID:', user.company_id);
            console.log('Company:', user.company ? user.company.name : 'None');
            console.log('Active:', user.active);
        } else {
            console.log('User 36 not found.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
