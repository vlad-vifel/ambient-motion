import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { prisma } from '../lib/prisma';
import { uploadThumbnail, uploadVideoFile } from '../lib/s3';
import { renderThumbnail } from './thumbnail';
import { renderVideo } from './render';
import { applyGrainFilter } from './ffmpeg-grain';

let running = false;
let wake: (() => void) | null = null;

export function notifyWorker(): void {
    wake?.();
}

export async function startWorker(): Promise<void> {
    if (running) return;
    running = true;

    await prisma.video.updateMany({
        where: { status: 'GENERATING' },
        data: { status: 'QUEUED' },
    });

    loop().catch(console.error);
}

async function loop(): Promise<void> {
    while (running) {
        const job = await prisma.video.findFirst({
            where: { status: 'QUEUED' },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                sourceImageUrl: true,
                sourceAudioUrl: true,
                phrase: true,
                durationMs: true,
                fadeInMs: true,
                fadeOutMs: true,
                userId: true,
                presetId: true,
            },
        });

        if (!job) {
            await new Promise<void>((resolve) => {
                const timer = setTimeout(resolve, 2000);
                wake = () => {
                    clearTimeout(timer);
                    resolve();
                };
            });
            wake = null;
            continue;
        }

        await processJob(job);
    }
}

async function processJob(job: {
    id: string;
    sourceImageUrl: string;
    sourceAudioUrl: string;
    phrase: string;
    durationMs: number;
    fadeInMs: number;
    fadeOutMs: number;
    userId: string;
    presetId: string;
}): Promise<void> {
    const tmpDir = path.join(os.tmpdir(), `am-${job.id}`);
    console.log(`[Worker] Starting job ${job.id}`, {
        phrase: job.phrase,
        duration: job.durationMs,
    });

    await fs.mkdir(tmpDir, { recursive: true });
    const videoPath = path.join(tmpDir, 'out.mp4');
    const thumbPath = path.join(tmpDir, 'thumb.jpg');

    try {
        console.log(`[Worker] Marking video as GENERATING...`);
        await prisma.video.update({
            where: { id: job.id },
            data: { status: 'GENERATING', startedAt: new Date() },
        });

        const preset = await prisma.videoPreset.findUnique({ where: { id: job.presetId } });
        if (!preset) throw new Error(`Preset ${job.presetId} not found`);

        const renderParams = {
            presetId: preset.component,
            imageUrl: job.sourceImageUrl,
            audioUrl: job.sourceAudioUrl,
            phrase: job.phrase,
            durationMs: job.durationMs,
            fadeInMs: job.fadeInMs,
            fadeOutMs: job.fadeOutMs,
        };

        console.log(`[Worker] Starting video render...`);
        try {
            await renderVideo({ ...renderParams, outputPath: videoPath });
            console.log(`[Worker] Video render completed`);
        } catch (err) {
            console.error(`[Worker] Video render failed:`, err);
            throw err;
        }

        console.log(`[Worker] Applying grain filter...`);
        try {
            await applyGrainFilter(videoPath, videoPath);
            console.log(`[Worker] Grain filter applied`);
        } catch (err) {
            console.error(`[Worker] Grain filter failed:`, err);
            throw err;
        }

        console.log(`[Worker] Starting thumbnail render...`);
        try {
            await renderThumbnail({ ...renderParams, outputPath: thumbPath });
            console.log(`[Worker] Thumbnail render completed`);
        } catch (err) {
            console.error(`[Worker] Thumbnail render failed:`, err);
            throw err;
        }

        console.log(`[Worker] Reading files from disk...`);
        const videoBuffer = await fs.readFile(videoPath);
        const thumbBuffer = await fs.readFile(thumbPath);
        console.log(
            `[Worker] Files read - video: ${videoBuffer.length} bytes, thumb: ${thumbBuffer.length} bytes`,
        );

        const videoKey = `videos/${job.id}/out.mp4`;
        const thumbKey = `videos/${job.id}/thumb.jpg`;

        console.log(`[Worker] Uploading to S3...`);
        await uploadVideoFile(videoKey, videoBuffer, job.userId);
        await uploadThumbnail(thumbKey, thumbBuffer, job.userId);
        console.log(`[Worker] Upload completed`);

        console.log(`[Worker] Updating database with COMPLETED status...`);
        await prisma.video.update({
            where: { id: job.id },
            data: {
                status: 'COMPLETED',
                videoUrl: videoKey,
                thumbnailUrl: thumbKey,
                completedAt: new Date(),
            },
        });
        console.log(`[Worker] Job ${job.id} completed successfully`);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : '';
        console.error(`[Worker] Job ${job.id} failed:`, message);
        console.error(`[Worker] Stack:`, stack);

        await prisma.video.update({
            where: { id: job.id },
            data: {
                status: 'FAILED',
                errorMessage: message.slice(0, 1000),
            },
        });
    } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
    }
}
