const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    try {
        const c = await prisma.performance_campaign.findFirst({ orderBy: { created_at: 'desc' } });
        if (!c) return console.log('No campaign');
        console.log('Campaign ID:', c.id, 'Status:', c.status);

        const r = await prisma.performance_review.count({ where: { campaign_id: c.id } });
        console.log('Reviews Count:', r);

        const n = await prisma.notification.count({ where: { type: 'PERFORMANCE_CAMPAIGN_LAUNCHED' } });
        console.log('Notifs Count:', n);
    } catch (e) {
        console.log('Error:', e.message);
    }
}
main().finally(() => prisma.$disconnect());
