import type { AudioSourceType } from './audio';

export const VideoStatus = {
    Draft: 'DRAFT',
    Queued: 'QUEUED',
    Generating: 'GENERATING',
    Completed: 'COMPLETED',
    Failed: 'FAILED',
} as const;

export type VideoStatus = (typeof VideoStatus)[keyof typeof VideoStatus];

export interface Video {
    id: string;
    title: string;
    phrase: string;
    choiceLeft: string | null;
    choiceRight: string | null;
    settings: unknown | null;
    status: VideoStatus;
    videoUrl: string | null;
    thumbnailUrl: string | null;
    errorMessage: string | null;
    sessionId: string | null;
    session?: { id: string; name: string | null } | null;
    presetId: string;
    preset?: { id: string; name: string; component: string; format: string } | null;
    assetId: string | null;
    asset?: { id: string; url: string; filename: string } | null;
    audioId: string | null;
    audio?: {
        id: string;
        title: string;
        artist: string;
        coverUrl: string | null;
        duration: number;
        filename?: string;
        url?: string | null;
        sourceType: AudioSourceType;
        sourceUrl: string | null;
    } | null;
    durationMs: number;
    fadeInMs: number;
    fadeOutMs: number;
    audioStartMs: number;
    audioFadeInMs: number;
    audioFadeOutMs: number;
    noAudio: boolean;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
}
