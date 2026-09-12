import type { Video } from '@/types/video';

export interface VideoEditDialogProps {
    open: boolean;
    video?: Video | null;
}

export interface VideoEditDialogEmits {
    (event: 'update:open', value: boolean): void;
    (event: 'requeued'): void;
}

export interface TrackEditorEntry {
    audioId: string;
    trimStartMs: number;
    trimEndMs: number;
    audioFadeInMs: number;
    audioFadeOutMs: number;
    settings: Record<string, unknown>;
}

export interface VideoListItemProps {
    video: Video;
    selectable?: boolean;
    selected?: boolean;
    showPreset?: boolean;
}

export interface VideoListItemEmits {
    'click': [];
    'delete': [];
    'edit': [];
    'toggle-select': [];
}

export interface LightboxVideo {
    src: string;
    phrase: string;
    videoId?: string;
}

export interface VideoLightboxProps {
    open: boolean;
    items: LightboxVideo[];
    initialIndex?: number;
}

export interface VideoLightboxEmits {
    (event: 'update:open', value: boolean): void;
}
