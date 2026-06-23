import type { Video } from './video';
import type { Audio } from '@/stores/audio';
import type { Asset } from '@/stores/assets';

export interface SessionAssetEntry {
    sessionId: string;
    assetId: string;
    asset: Asset;
}

export interface GenerationSession {
    id: string;
    name: string | null;
    index: number;
    durationMs: number;
    fadeInMs?: number;
    fadeOutMs?: number;
    isDraft: boolean;
    assetSource?: string | null;
    autoAssign?: boolean;
    audioId: string | null;
    audio?: Audio | null;
    noAudio: boolean;
    presetId: string;
    preset?: { id: string; name: string; component: string; format: string } | null;
    assets: SessionAssetEntry[];
    videos: Video[];
    videoCounts?: {
        queued: number;
        generating: number;
        completed: number;
        failed: number;
    };
    createdAt: string;
}
