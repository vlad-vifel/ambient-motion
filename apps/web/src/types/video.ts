export type VideoStatus = 'QUEUED' | 'GENERATING' | 'COMPLETED' | 'FAILED';

export interface Video {
    id: string;
    title: string;
    phrase: string;
    status: VideoStatus;
    videoUrl: string | null;
    thumbnailUrl: string | null;
    errorMessage: string | null;
    sessionId: string | null;
    session?: { id: string; name: string | null } | null;
    assetId: string | null;
    audioId: string | null;
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
