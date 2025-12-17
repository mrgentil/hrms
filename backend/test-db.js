require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Défini (masqué)' : 'NON DÉFINI');

const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.user.count();
        console.log('Connexion OK. Users:', count);
    } catch (e) {
        console.error('Erreur Connexion:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
