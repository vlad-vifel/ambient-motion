import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { makeCancelSignal } from '@remotion/renderer';
import { prisma } from '../lib/prisma';
import { generateSignedUrl, uploadThumbnail, uploadVideoFile } from '../lib/s3';
import { getPresetDefinition } from '../presets/registry';
import { PresetAssetSource, PresetAudioRenderStrategy } from '../presets/types';
import { muxAudioTrack } from './audio';
import { applyGrainFilter } from './ffmpeg-grain';
import { renderVideo } from './render';
import type { RenderInputProps } from './render-types';
import { renderThumbnail } from './thumbnail';

const SIGNED_URL_TTL_SECONDS = 24 * 60 * 60;
const RENDER_TIMEOUT_MS = 15 * 60 * 1000;

async function withTimeout<T>(
    operation: Promise<T>,
    timeoutMs: number,
    onTimeout: () => void,
): Promise<T> {
    let timeout: NodeJS.Timeout | undefined;
    try {
        return await Promise.race([
            operation,
            new Promise<never>((_resolve, reject) => {
                timeout = setTimeout(() => {
                    onTimeout();
                    reject(new Error(`Video render timed out after ${timeoutMs / 1000}s`));
                }, timeoutMs);
            }),
        ]);
    } finally {
        if (timeout) clearTimeout(timeout);
    }
}

export async function processVideo(videoId: string): Promise<boolean> {
    const startedAt = new Date();
    const claim = await prisma.video.updateMany({
        where: { id: videoId, status: 'QUEUED' },
        data: { status: 'GENERATING', startedAt, errorMessage: null },
    });
    if (claim.count !== 1) return false;

    const tmpDir = path.join(os.tmpdir(), `am-${videoId}`);
    const videoPath = path.join(tmpDir, 'out.mp4');
    const renderedVideoPath = path.join(tmpDir, 'rendered.mp4');
    const thumbnailPath = path.join(tmpDir, 'thumb.jpg');

    try {
        await fs.mkdir(tmpDir, { recursive: true });
        const video = await prisma.video.findUnique({
            where: { id: videoId },
            include: { preset: true, asset: true, audio: true },
        });
        if (!video) throw new Error(`Video ${videoId} not found`);

        const preset = getPresetDefinition(video.preset.id);
        if (video.preset.component !== preset.compositionId) {
            throw new Error(`Preset component mismatch for ${preset.id}`);
        }

        const imageStorageKey =
            preset.assetSource === PresetAssetSource.AudioCover
                ? video.audio?.coverFilename
                    ? `covers/${video.audio.coverFilename}`
                    : null
                : video.asset?.storageKey;
        if (!imageStorageKey) throw new Error(`Source image is unavailable for ${preset.id}`);

        const imageUrl = generateSignedUrl(imageStorageKey, video.userId, SIGNED_URL_TTL_SECONDS);
        const audioUrl = video.audio
            ? generateSignedUrl(
                  `audio/${video.audio.filename}`,
                  video.userId,
                  SIGNED_URL_TTL_SECONDS,
              )
            : '';
        const inputProps: RenderInputProps = {
            imageUrl,
            audioUrl,
            phrase: video.phrase,
            durationMs: video.durationMs,
            fadeInMs: video.fadeInMs,
            fadeOutMs: video.fadeOutMs,
            choiceLeft: video.choiceLeft ?? undefined,
            choiceRight: video.choiceRight ?? undefined,
            settings: video.settings ?? undefined,
            title: video.title,
            artist: video.audio?.artist ?? '',
            fullAudioDurationMs: video.audio ? Math.round(video.audio.duration) : undefined,
            audioStartMs: video.audioStartMs,
            audioFadeInMs: video.audioFadeInMs,
            audioFadeOutMs: video.audioFadeOutMs,
        };

        const usesPreparedAudio =
            preset.audioRenderStrategy === PresetAudioRenderStrategy.PreparedTrack;
        const preparedAudioPath = path.join(tmpDir, 'audio.m4a');
        if (usesPreparedAudio) {
            if (!audioUrl || !video.audio || !preset.prepareAudio) {
                throw new Error(`Prepared audio is unavailable for ${preset.id}`);
            }
            await preset.prepareAudio({
                sourceUrl: audioUrl,
                outputPath: preparedAudioPath,
                startMs: video.audioStartMs,
                durationMs: video.durationMs,
                fadeInMs: video.audioFadeInMs,
                fadeOutMs: video.audioFadeOutMs,
            });
        }

        const { cancelSignal, cancel } = makeCancelSignal();
        await withTimeout(
            renderVideo(
                {
                    ...inputProps,
                    audioUrl: usesPreparedAudio ? '' : audioUrl,
                    presetId: preset.compositionId,
                    outputPath: usesPreparedAudio ? renderedVideoPath : videoPath,
                },
                cancelSignal,
            ),
            RENDER_TIMEOUT_MS,
            cancel,
        );
        const renderedPath = usesPreparedAudio ? renderedVideoPath : videoPath;
        if (preset.applyGrain) await applyGrainFilter(renderedPath, renderedPath);
        if (usesPreparedAudio) {
            await muxAudioTrack({
                videoPath: renderedVideoPath,
                audioPath: preparedAudioPath,
                outputPath: videoPath,
            });
        }
        await renderThumbnail({
            videoPath,
            durationMs: video.durationMs,
            outputPath: thumbnailPath,
        });

        const [videoBuffer, thumbnailBuffer] = await Promise.all([
            fs.readFile(videoPath),
            fs.readFile(thumbnailPath),
        ]);
        const videoKey = `videos/${videoId}/out.mp4`;
        const thumbnailKey = `videos/${videoId}/thumb.jpg`;
        await Promise.all([
            uploadVideoFile(videoKey, videoBuffer, video.userId),
            uploadThumbnail(thumbnailKey, thumbnailBuffer, video.userId),
        ]);

        await prisma.video.updateMany({
            where: { id: videoId, status: 'GENERATING', startedAt },
            data: {
                status: 'COMPLETED',
                videoUrl: videoKey,
                thumbnailUrl: thumbnailKey,
                completedAt: new Date(),
            },
        });
        console.log(`[Generator] Video ${videoId} completed`);
        return true;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[Generator] Video ${videoId} failed:`, message);
        await prisma.video.updateMany({
            where: { id: videoId, status: 'GENERATING', startedAt },
            data: { status: 'FAILED', errorMessage: message.slice(0, 1000) },
        });
        return false;
    } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
    }
}
