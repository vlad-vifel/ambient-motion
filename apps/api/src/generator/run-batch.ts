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
    const foundIds = new Set(videos.map((video) => video.id));
    const missingIds = videoIds.filter((videoId) => !foundIds.has(videoId));
    if (missingIds.length) {
        throw new Error(`Batch contains ${missingIds.length} unknown video id(s)`);
    }

    console.log(`[Generator] Processing ${videos.length} video(s)`);
    let failedCount = 0;
    for (const video of videos) {
        if (!(await processVideo(video.id))) failedCount += 1;
    }
    if (failedCount) {
        throw new Error(`${failedCount} of ${videos.length} video(s) failed`);
    }
    console.log(`[Generator] Completed ${videos.length} video(s)`);
}

runBatch()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
