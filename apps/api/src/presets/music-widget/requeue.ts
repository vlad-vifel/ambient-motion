import { Prisma } from '@prisma/client';
import { triggerBatchVideoGeneration } from '../../generator/dispatch';
import { prisma } from '../../lib/prisma';
import { deleteFile, generateSignedUrl } from '../../lib/s3';
import { formatMusicWidgetVideoTitle, hasInvalidMusicWidgetTiming } from './utils';

type MusicWidgetVideo = Prisma.VideoGetPayload<{
    include: { preset: true; asset: true; audio: true };
}>;

export interface MusicWidgetRequeueInput {
    settings?: unknown;
    audioStartMs?: number;
    durationMs?: number;
    audioFadeInMs?: number;
    audioFadeOutMs?: number;
}

export type MusicWidgetRequeueResult =
    | { ok: true; video: Awaited<ReturnType<typeof prisma.video.update>> }
    | { ok: false; status: number; error: string };

export async function requeueMusicWidgetVideo(
    video: MusicWidgetVideo,
    userId: string,
    input: MusicWidgetRequeueInput,
): Promise<MusicWidgetRequeueResult> {
    if (!video.audio || video.audio.sourceType !== 'SPOTIFY' || !video.audio.coverFilename) {
        return { ok: false, status: 400, error: 'Spotify audio or cover is no longer available' };
    }

    const audioStartMs = Math.round(input.audioStartMs ?? video.audioStartMs);
    const durationMs = Math.round(input.durationMs ?? video.durationMs);
    const audioFadeInMs = Math.round(input.audioFadeInMs ?? video.audioFadeInMs);
    const audioFadeOutMs = Math.round(input.audioFadeOutMs ?? video.audioFadeOutMs);
    const fullDurationMs = Math.round(video.audio.duration);
    if (
        hasInvalidMusicWidgetTiming({
            audioStartMs,
            durationMs,
            audioFadeInMs,
            audioFadeOutMs,
            fullDurationMs,
        })
    ) {
        return {
            ok: false,
            status: 400,
            error: 'Invalid Music Widget trim or audio fade settings',
        };
    }

    const settings = input.settings === undefined ? video.settings : input.settings;
    const settingsChanged = JSON.stringify(settings) !== JSON.stringify(video.settings);
    const timingChanged =
        audioStartMs !== video.audioStartMs ||
        durationMs !== video.durationMs ||
        audioFadeInMs !== video.audioFadeInMs ||
        audioFadeOutMs !== video.audioFadeOutMs;
    if (!timingChanged && !settingsChanged) {
        return { ok: false, status: 400, error: 'No changes detected' };
    }

    await Promise.all([
        video.videoUrl ? deleteFile(video.videoUrl, userId) : Promise.resolve(),
        video.thumbnailUrl ? deleteFile(video.thumbnailUrl, userId) : Promise.resolve(),
    ]);
    const visualFadeMs = Math.round(Math.min(2000, durationMs / 2));
    const updated = await prisma.video.update({
        where: { id: video.id },
        data: {
            settings: (settings ?? Prisma.JsonNull) as
                | Prisma.InputJsonValue
                | typeof Prisma.JsonNull,
            audioStartMs,
            durationMs,
            audioFadeInMs,
            audioFadeOutMs,
            title: formatMusicWidgetVideoTitle(video.audio.artist, video.audio.title),
            fadeInMs: visualFadeMs,
            fadeOutMs: visualFadeMs,
            status: 'QUEUED',
            videoUrl: null,
            thumbnailUrl: null,
            startedAt: null,
            completedAt: null,
            errorMessage: null,
            sourceImageUrl: generateSignedUrl(
                `covers/${video.audio.coverFilename}`,
                userId,
                24 * 60 * 60,
            ),
            sourceAudioUrl: generateSignedUrl(
                `audio/${video.audio.filename}`,
                userId,
                24 * 60 * 60,
            ),
        },
    });
    await triggerBatchVideoGeneration([updated.id]);
    return { ok: true, video: updated };
}
