import type { RpgSettings } from './rpgSettings';

export type VideoStatus = 'QUEUED' | 'GENERATING' | 'COMPLETED' | 'FAILED';

export interface Video {
    id: string;
    title: string;
    phrase: string;
    choiceLeft: string | null;
    choiceRight: string | null;
    settings: RpgSettings | null;
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
    noAudio: boolean;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
}

export interface VideoPreset {
    id: string;
    label: string;
    width: number;
    height: number;
    fps: number;
}
