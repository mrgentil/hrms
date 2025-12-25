require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
    try {
        const settings = await prisma.app_settings.findMany();
        let output = '--- ALL APP SETTINGS ---\n';
        settings.forEach(s => {
            output += `Key: "${s.key}"\n`;
            output += `Value: "${s.value}"\n`;
            output += `Category: "${s.category}"\n`;
            output += `Is Public: "${s.is_public}"\n`;
            output += '-------------------\n';
        });
        output += '--- END ---';
        fs.writeFileSync('settings-dump.txt', output);
        console.log('Settings dumped to settings-dump.txt');
    } catch (e) {
        console.error('Erreur:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
