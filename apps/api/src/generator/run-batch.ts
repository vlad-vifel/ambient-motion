import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { processVideo } from './process-video';

async function runBatch(): Promise<void> {
    const videoIds = JSON.parse(process.env.VIDEO_IDS ?? '[]') as string[];
    if (!videoIds.length) throw new Error('VIDEO_IDS must contain at least one video id');

    const videos = await prisma.video.findMany({
        where: { id: { in: videoIds } },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
    });
    for (const video of videos) await processVideo(video.id);
}

runBatch()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
