import type { VideoPreset } from '@/types/preset';

export interface PresetOptionProps {
    preset: VideoPreset;
}

export interface PresetSelectFieldProps {
    modelValue: string;
    presets: VideoPreset[];
}

export interface PresetSelectFieldEmits {
    (event: 'update:modelValue', value: string): void;
}
