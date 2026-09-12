export interface RenderInputProps {
    imageUrl: string;
    audioUrl: string;
    phrase: string;
    durationMs: number;
    fadeInMs: number;
    fadeOutMs: number;
    choiceLeft?: string;
    choiceRight?: string;
    settings?: unknown;
    title?: string;
    artist?: string;
    fullAudioDurationMs?: number;
    audioStartMs?: number;
    audioFadeInMs?: number;
    audioFadeOutMs?: number;
}

export interface RenderParams extends RenderInputProps {
    presetId: string;
    outputPath: string;
}
