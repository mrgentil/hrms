const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- DEBUG START ---');

    try {
        // 1. Check Last Campaign
        const lastCampaign = await prisma.performance_campaign.findFirst({
            orderBy: { created_at: 'desc' }
        });

        if (lastCampaign) {
            console.log(`Last Campaign: ID=${lastCampaign.id}, Title="${lastCampaign.title}", Status=${lastCampaign.status}`);

            // Reviews for last campaign
            const campReviewsCount = await prisma.performance_review.count({
                where: { campaign_id: lastCampaign.id }
            });
            console.log(`Reviews for Campaign #${lastCampaign.id}: ${campReviewsCount}`);
        } else {
            console.log('No campaigns found.');
        }

        // 2. Check Notifications
        console.log('Fetching latest notifications...');
        const notifs = await prisma.notification.findMany({
            take: 5,
            orderBy: { created_at: 'desc' }
        });
        console.log('Latest 5 Notifications:');
        notifs.forEach(n => console.log(`- ID:${n.id} User:${n.user_id} Type:${n.type} Title:"${n.title}"`));

    } catch (e) {
        console.error('DEBUG ERROR:', e);
    }

    console.log('--- DEBUG END ---');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
