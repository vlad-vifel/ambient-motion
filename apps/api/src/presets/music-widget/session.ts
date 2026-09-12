import { Prisma } from '@prisma/client';
import { triggerBatchVideoGeneration } from '../../generator/dispatch';
import { prisma } from '../../lib/prisma';
import { generateSignedUrl } from '../../lib/s3';
import { MUSIC_WIDGET_PRESET_ID } from './constants';
import { formatMusicWidgetVideoTitle, hasInvalidMusicWidgetTiming } from './utils';

export interface MusicWidgetDraftEntry {
    audioId?: string;
    trimStartMs?: number;
    trimEndMs?: number;
    audioFadeInMs?: number;
    audioFadeOutMs?: number;
    settings?: unknown;
}

export type MusicWidgetDraftResult =
    | { ok: true; videos: Prisma.VideoCreateManyInput[] }
    | { ok: false; error: string };

export async function prepareMusicWidgetDraft(
    entries: MusicWidgetDraftEntry[],
    userId: string,
): Promise<MusicWidgetDraftResult> {
    if (entries.length === 0) return { ok: true, videos: [] };
    if (entries.length < 1 || entries.length > 10) {
        return { ok: false, error: 'Music Widget requires between 1 and 10 Spotify tracks' };
    }

    const audioIds = entries.map((entry) => entry.audioId).filter((id): id is string => !!id);
    if (audioIds.length !== entries.length || new Set(audioIds).size !== audioIds.length) {
        return { ok: false, error: 'A Spotify track can only be selected once' };
    }

    const audios = await prisma.audio.findMany({
        where: { id: { in: audioIds }, userId, sourceType: 'SPOTIFY' },
        select: { id: true, duration: true, title: true, artist: true, coverFilename: true },
    });
    if (audios.length !== audioIds.length || audios.some((audio) => !audio.coverFilename)) {
        return {
            ok: false,
            error: 'Every Music Widget entry needs an imported Spotify track with cover art',
        };
    }

    const audioById = new Map(audios.map((audio) => [audio.id, audio]));
    const videos: Prisma.VideoCreateManyInput[] = [];
    for (const entry of entries) {
        const audio = audioById.get(entry.audioId!);
        const audioStartMs = Math.round(entry.trimStartMs ?? 0);
        const trimEndMs = Math.round(entry.trimEndMs ?? 0);
        const durationMs = trimEndMs - audioStartMs;
        const audioFadeInMs = Math.round(entry.audioFadeInMs ?? 0);
        const audioFadeOutMs = Math.round(entry.audioFadeOutMs ?? 0);
        if (
            !audio ||
            hasInvalidMusicWidgetTiming({
                audioStartMs,
                durationMs,
                audioFadeInMs,
                audioFadeOutMs,
                fullDurationMs: Math.round(audio.duration),
            })
        ) {
            return { ok: false, error: 'One or more Music Widget trim settings are invalid' };
        }

        const visualFadeMs = Math.round(Math.min(2000, durationMs / 2));
        const videoTitle = formatMusicWidgetVideoTitle(audio.artist, audio.title);
        videos.push({
            title: videoTitle,
            phrase: audio.title,
            settings: (entry.settings ?? undefined) as Prisma.InputJsonValue | undefined,
            status: 'DRAFT',
            presetId: MUSIC_WIDGET_PRESET_ID,
            assetId: null,
            sourceImageUrl: '',
            audioId: audio.id,
            noAudio: false,
            sourceAudioUrl: '',
            durationMs,
            fadeInMs: visualFadeMs,
            fadeOutMs: visualFadeMs,
            audioStartMs,
            audioFadeInMs,
            audioFadeOutMs,
            userId,
        });
    }
    return { ok: true, videos };
}

export type QueueMusicWidgetResult =
    | { ok: true; jobs: Awaited<ReturnType<typeof prisma.video.update>>[] }
    | { ok: false; error: string };

export async function queueMusicWidgetSession(
    sessionId: string,
    userId: string,
    isDraft: boolean,
): Promise<QueueMusicWidgetResult> {
    const drafts = await prisma.video.findMany({
        where: { sessionId, status: 'DRAFT' },
        include: { audio: true },
        orderBy: { createdAt: 'asc' },
    });
    if (!drafts.length) return { ok: false, error: 'Music Widget session has no tracks' };
    if (
        drafts.some(
            (draft) =>
                !draft.audio || draft.audio.sourceType !== 'SPOTIFY' || !draft.audio.coverFilename,
        )
    ) {
        return { ok: false, error: 'A selected Spotify track is no longer available' };
    }

    const jobs = await prisma.$transaction(
        drafts.map((draft) =>
            prisma.video.update({
                where: { id: draft.id },
                data: {
                    status: 'QUEUED',
                    sourceImageUrl: generateSignedUrl(
                        `covers/${draft.audio!.coverFilename}`,
                        userId,
                        24 * 60 * 60,
                    ),
                    sourceAudioUrl: generateSignedUrl(
                        `audio/${draft.audio!.filename}`,
                        userId,
                        24 * 60 * 60,
                    ),
                },
            }),
        ),
    );
    if (isDraft) {
        await prisma.generationSession.update({
            where: { id: sessionId },
            data: { isDraft: false },
        });
    }
    await triggerBatchVideoGeneration(jobs.map((job) => job.id));
    return { ok: true, jobs };
}
