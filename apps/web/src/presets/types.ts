import type { Component } from 'vue';

export const PresetEntryMode = {
    Phrase: 'phrase',
    Dialogue: 'rpg-dialogue',
    Track: 'track',
} as const;

export type PresetEntryMode = (typeof PresetEntryMode)[keyof typeof PresetEntryMode];

export const PresetAccent = {
    Ambient: 'ambient',
    Dialogue: 'dialogue',
    Music: 'music',
    Default: 'default',
} as const;

export type PresetAccent = (typeof PresetAccent)[keyof typeof PresetAccent];

export interface PresetDefinition {
    id: string;
    accent: PresetAccent;
    createComponent: Component;
    entryMode: PresetEntryMode;
    supportsNoAudio: boolean;
    usesAssets: boolean;
    entryCardComponent?: Component;
    settingsDialogComponent?: Component;
    defaultSettings?: () => object;
}
