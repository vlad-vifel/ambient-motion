import 'dotenv/config';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { prisma } from '../lib/prisma';
import { uploadThumbnail, uploadVideoFile, generateSignedUrl } from '../lib/s3';
import { renderThumbnail } from './thumbnail';
import { renderVideo } from './render';
import { applyGrainFilter } from './ffmpeg-grain';

async function runBatch(): Promise<void> {
    const videoIds: string[] = JSON.parse(process.env.VIDEO_IDS!);
    console.log(`[Batch] Starting batch of ${videoIds.length} videos`);

    const videos = await prisma.video.findMany({
        where: { id: { in: videoIds } },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
    });

    for (const { id } of videos) {
        await runJob(id);
    }

    console.log(`[Batch] All ${videoIds.length} videos processed`);
    await prisma.$disconnect();
}

async function runJob(videoId: string): Promise<void> {
    const tmpDir = path.join(os.tmpdir(), `am-${videoId}`);
    await fs.mkdir(tmpDir, { recursive: true });
    const videoPath = path.join(tmpDir, 'out.mp4');
    const thumbPath = path.join(tmpDir, 'thumb.jpg');

    try {
        const video = await prisma.video.findUnique({
            where: { id: videoId },
            include: { preset: true, asset: true, audio: true },
        });

        if (!video) throw new Error(`Video ${videoId} not found`);

        console.log(`[Batch] [${videoId}] Starting: "${video.phrase}"`);

        await prisma.video.update({
            where: { id: videoId },
            data: { status: 'GENERATING', startedAt: new Date() },
        });

        const sourceImageUrl = generateSignedUrl(video.asset!.storageKey, video.userId, 24 * 3600);
        const sourceAudioUrl = video.audio
            ? generateSignedUrl(`audio/${video.audio.filename}`, video.userId, 24 * 3600)
            : '';

        const renderParams = {
            presetId: video.preset!.component,
            imageUrl: sourceImageUrl,
            audioUrl: sourceAudioUrl,
            phrase: video.phrase,
            durationMs: video.durationMs,
            fadeInMs: video.fadeInMs,
            fadeOutMs: video.fadeOutMs,
            choiceLeft: video.choiceLeft ?? undefined,
            choiceRight: video.choiceRight ?? undefined,
            settings: video.settings ?? undefined,
        };

        await renderVideo({ ...renderParams, outputPath: videoPath });
        console.log(`[Batch] [${videoId}] Video rendered`);

        if (video.preset!.id !== 'rpg-dialogue') {
            await applyGrainFilter(videoPath, videoPath);
        }

        await renderThumbnail({ ...renderParams, outputPath: thumbPath });
        console.log(`[Batch] [${videoId}] Thumbnail rendered`);

        const videoBuffer = await fs.readFile(videoPath);
        const thumbBuffer = await fs.readFile(thumbPath);

        const videoKey = `videos/${videoId}/out.mp4`;
        const thumbKey = `videos/${videoId}/thumb.jpg`;

        await uploadVideoFile(videoKey, videoBuffer, video.userId);
        await uploadThumbnail(thumbKey, thumbBuffer, video.userId);
        console.log(`[Batch] [${videoId}] Uploaded to storage`);

        await prisma.video.update({
            where: { id: videoId },
            data: {
                status: 'COMPLETED',
                videoUrl: videoKey,
                thumbnailUrl: thumbKey,
                completedAt: new Date(),
            },
        });

        console.log(`[Batch] [${videoId}] Completed`);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Batch] [${videoId}] Failed:`, message);

        await prisma.video.update({
            where: { id: videoId },
            data: { status: 'FAILED', errorMessage: message.slice(0, 1000) },
        });
    } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
    }
}

runBatch().catch((err) => {
    console.error(err);
    process.exit(1);
});
