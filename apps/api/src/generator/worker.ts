import { prisma } from '../lib/prisma';
import { processVideo } from './process-video';

let running = false;
const STALE_JOB_AFTER_MS = 30 * 60 * 1000;

export async function startWorker(): Promise<void> {
    if (running) return;
    running = true;
    await prisma.video.updateMany({
        where: {
            status: 'GENERATING',
            OR: [
                { startedAt: null },
                { startedAt: { lt: new Date(Date.now() - STALE_JOB_AFTER_MS) } },
            ],
        },
        data: { status: 'QUEUED' },
    });
    await runLoop();
}

async function waitForWork(): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 2000));
}

async function runLoop(): Promise<void> {
    while (running) {
        const job = await prisma.video.findFirst({
            where: { status: 'QUEUED' },
            orderBy: { createdAt: 'asc' },
            select: { id: true },
        });
        if (!job) {
            await waitForWork();
            continue;
        }
        await processVideo(job.id);
    }
}
