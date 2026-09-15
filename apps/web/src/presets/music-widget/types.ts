import type { Audio } from '@/stores/audio';

export interface MusicWidgetSettings {
    overallBrightness: number;
    watermarkBrightness: number;
    backgroundBrightness: number;
    contrast: number;
    watermarkEnabled: boolean;
    watermarkText: string;
}

export interface MusicWidgetEntry {
    audioId: string;
    trimStartMs: number;
    trimEndMs: number;
    audioFadeInMs: number;
    audioFadeOutMs: number;
    settings: MusicWidgetSettings;
}

export interface MusicWidgetCreateProps {
    modelValue: MusicWidgetEntry[];
    step: 1 | 2;
    tracks: Audio[];
    submitting: boolean;
    error?: string;
}

export interface MusicWidgetCreateEmits {
    (event: 'update:modelValue', value: MusicWidgetEntry[]): void;
    (event: 'generate'): void;
    (event: 'next'): void;
    (event: 'back'): void;
}

export interface MusicWidgetCreateFlowProps {
    presetId: string;
}

export interface MusicWidgetPreviewCanvasProps {
    track: Audio;
    settings: MusicWidgetSettings;
    previewCurrentTime: number;
    previewProgress: number;
    buttonsAsset: string;
    overlayAsset: string;
    visualizerAsset: string;
}

export interface MusicWidgetSettingsDialogProps {
    open: boolean;
    track: Audio | null;
    entry: MusicWidgetEntry | null;
    submitLabel?: string;
    resetToInitial?: boolean;
}

export interface MusicWidgetSettingsDialogEmits {
    (event: 'update:open', value: boolean): void;
    (event: 'apply', value: MusicWidgetEntry): void;
}

export const defaultMusicWidgetSettings = (): MusicWidgetSettings => ({
    overallBrightness: 100,
    watermarkBrightness: 100,
    backgroundBrightness: 100,
    contrast: 100,
    watermarkEnabled: true,
    watermarkText: 'ambient mode',
});
