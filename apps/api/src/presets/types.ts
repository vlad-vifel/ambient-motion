import type { Prisma } from '@prisma/client';
import type { ComponentType } from 'react';

export enum PresetAssetSource {
    Asset = 'asset',
    AudioCover = 'audio-cover',
}

export enum PresetAudioRenderStrategy {
    Remotion = 'remotion',
    PreparedTrack = 'prepared-track',
}

interface PresetDisplayMetadata {
    name: string;
    description: string | null;
    format: 'SQUARE_1_1' | 'VERTICAL_9_16';
}

interface PresetAudioPreparationInput {
    sourceUrl: string;
    outputPath: string;
    startMs: number;
    durationMs: number;
    fadeInMs: number;
    fadeOutMs: number;
}

interface PresetDraftEntry {
    phrase: string;
    choiceLeft?: string | null;
    choiceRight?: string | null;
    assetId?: string | null;
    settings?: unknown;
    audioId?: string;
    trimStartMs?: number;
    trimEndMs?: number;
    audioFadeInMs?: number;
    audioFadeOutMs?: number;
}

interface PresetRequeueInput {
    settings?: unknown;
    audioStartMs?: number;
    durationMs?: number;
    audioFadeInMs?: number;
    audioFadeOutMs?: number;
}

type PresetVideo = Prisma.VideoGetPayload<{
    include: { preset: true; asset: true; audio: true };
}>;

interface PresetWorkflow {
    prepareDraft?: (
        entries: PresetDraftEntry[],
        userId: string,
    ) => Promise<
        { ok: true; videos: Prisma.VideoCreateManyInput[] } | { ok: false; error: string }
    >;
    queueSession?: (
        sessionId: string,
        userId: string,
        isDraft: boolean,
    ) => Promise<{ ok: true; jobs: unknown[] } | { ok: false; error: string }>;
    requeueVideo?: (
        video: PresetVideo,
        userId: string,
        input: PresetRequeueInput,
    ) => Promise<{ ok: true; video: unknown } | { ok: false; status: number; error: string }>;
}

export interface PresetRenderDefinition {
    id: string;
    compositionId: string;
    component: ComponentType<never>;
    defaultProps: Record<string, unknown>;
    width: number;
    height: number;
    fps: number;
}

export interface PresetDefinition extends PresetRenderDefinition {
    display: PresetDisplayMetadata;
    applyGrain: boolean;
    assetSource: PresetAssetSource;
    audioRenderStrategy: PresetAudioRenderStrategy;
    prepareAudio?: (input: PresetAudioPreparationInput) => Promise<void>;
    workflow?: PresetWorkflow;
}
