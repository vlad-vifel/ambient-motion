export const VIDEO_PRESETS = {
    'square-1080': { width: 1080, height: 1080, fps: 30 },
    'vertical-1080': { width: 1080, height: 1920, fps: 30 },
} as const;

export type PresetId = keyof typeof VIDEO_PRESETS;
